export type LPProblem = {
  problemType: 'max' | 'min'
  objectiveFunction: number[]
  constraintCoefficients: number[][]
  constraintSigns: ("<=" | "=" | ">=")[]
  constraintValues: number[]
  objectiveOperator?: string // + ou -
  constraintOperators?: string[] // tableau de + ou -
}

export type SolutionMethod = 'graphical' | 'simplex' | 'general'

export type SimplexIteration = {
  iteration: number
  tableau: number[][]
  basis: string[]
  basisCoefficients: number[]
  pivot: { row: number; col: number } | null
  ratios?: number[]
  enteringVariable?: string
  leavingVariable?: string
  isOptimal: boolean
  objectiveValue: number
  cjRow: number[]
  deltaJRow: number[]
  variableNames: string[]
  phase: number // <-- Ajout pour la phase de l'itération
}

export type CanonicalForm = {
  objectiveFunction: number[]
  constraintMatrix: number[][]
  rightHandSide: number[]
  variableNames: string[]
  basisVariables: string[]
  explanation: string[]
}

export type LPSolution = {
  isValid: boolean
  coordinates: number[]
  value: number
  tableData: {
    headers: string[]
    rows: string[][]
  }
  iterations?: SimplexIteration[]
  canonicalForm?: CanonicalForm
  feasibleRegion?: number[][] // <-- ajout pour la visualisation graphique
  messages?: string[] // <-- Ajout pour les messages pédagogiques
}

function convertToCanonicalForm(
  objectiveFunction: number[],
  constraintCoefficients: number[][],
  constraintSigns: ("<=" | "=" | ">=")[],
  constraintValues: number[],
  isMaximization: boolean
): CanonicalForm {
  const m = constraintCoefficients.length;
  const n = objectiveFunction.length;
  
  // Convertir en maximisation si nécessaire
  const objective = isMaximization 
    ? [...objectiveFunction]
    : objectiveFunction.map(x => -x);

  // Variables originales
  const variableNames: string[] = [];
  for (let i = 0; i < n; i++) {
    variableNames.push(`x${i + 1}`);
  }

  // Matrice des contraintes étendue
  const constraintMatrix: number[][] = [];
  const basisVariables: string[] = [];
  const explanation: string[] = [];
  
  explanation.push("Conversion en forme canonique :");
  explanation.push(`Fonction objectif : ${isMaximization ? 'MAX' : 'MIN'} Z = ${objective.map((c, i) => `${c >= 0 && i > 0 ? '+' : ''}${c}x${i + 1}`).join('')}`);
  explanation.push("Contraintes :");

  let slackVarCount = 0;
  let surplusVarCount = 0;
  let artificialVarCount = 0;

  for (let i = 0; i < m; i++) {
    const row = [...constraintCoefficients[i]];
    const sign = constraintSigns[i];
    const value = constraintValues[i];
    
    explanation.push(`  ${constraintCoefficients[i].map((c, j) => `${c >= 0 && j > 0 ? '+' : ''}${c}x${j + 1}`).join('')} ${sign} ${value}`);
    
    if (sign === '<=') {
      // Ajouter variable d'écart
      slackVarCount++;
      const slackVarName = `s${slackVarCount}`;
      variableNames.push(slackVarName);
      basisVariables.push(slackVarName);
      
      // Ajouter des zéros pour toutes les variables d'écart précédentes
      for (let j = 0; j < m; j++) {
        row.push(j === i ? 1 : 0);
      }
    } else if (sign === '>=') {
      // Ajouter variable d'excès et artificielle
      surplusVarCount++;
      artificialVarCount++;
      const surplusVarName = `e${surplusVarCount}`;
      const artificialVarName = `a${artificialVarCount}`;
      variableNames.push(surplusVarName);
      variableNames.push(artificialVarName);
      basisVariables.push(artificialVarName);
      
      // Ajouter des zéros pour les variables d'excès et artificielles
      for (let j = 0; j < m; j++) {
        row.push(j === i ? -1 : 0); // Variable d'excès
      }
      for (let j = 0; j < m; j++) {
        row.push(j === i ? 1 : 0);  // Variable artificielle
      }
    } else { // '='
      // Ajouter variable artificielle
      artificialVarCount++;
      const artificialVarName = `a${artificialVarCount}`;
      variableNames.push(artificialVarName);
      basisVariables.push(artificialVarName);
      
      // Ajouter des zéros pour les variables d'écart
      for (let j = 0; j < m; j++) {
        row.push(0);
      }
      // Ajouter variable artificielle
      for (let j = 0; j < m; j++) {
        row.push(j === i ? 1 : 0);
      }
    }
    
    constraintMatrix.push(row);
  }

  // Étendre la fonction objectif avec des zéros pour les nouvelles variables
  const extendedObjective = [...objective];
  while (extendedObjective.length < variableNames.length) {
    extendedObjective.push(0);
  }

  explanation.push("Variables ajoutées :");
  explanation.push(`  Variables d'écart : ${slackVarCount > 0 ? Array.from({length: slackVarCount}, (_, i) => `s${i+1}`).join(', ') : 'aucune'}`);
  explanation.push(`  Variables d'excès : ${surplusVarCount > 0 ? Array.from({length: surplusVarCount}, (_, i) => `e${i+1}`).join(', ') : 'aucune'}`);
  explanation.push(`  Variables artificielles : ${artificialVarCount > 0 ? Array.from({length: artificialVarCount}, (_, i) => `a${i+1}`).join(', ') : 'aucune'}`);

  return {
    objectiveFunction: extendedObjective,
    constraintMatrix,
    rightHandSide: constraintValues,
    variableNames,
    basisVariables,
    explanation
  };
}

function simplexMethod(
  objectiveFunction: number[],
  constraintCoefficients: number[][],
  constraintSigns: ("<=" | "=" | ">=")[],
  constraintValues: number[],
  isMaximization: boolean
): LPSolution {
  const EPS = 1e-8;
  const messages: string[] = [];
  // Étape 1: Conversion en forme canonique
  const canonicalForm = convertToCanonicalForm(
    objectiveFunction,
    constraintCoefficients,
    constraintSigns,
    constraintValues,
    isMaximization
  );

  let { objectiveFunction: extendedObjective, constraintMatrix, rightHandSide, variableNames, basisVariables } = canonicalForm;
  const m = constraintMatrix.length;
  const n = variableNames.length;

  // --- PHASE 1 : Si variables artificielles, minimiser leur somme ---
  const artificialIndexes = variableNames
    .map((name, idx) => name.startsWith('a') ? idx : -1)
    .filter(idx => idx !== -1);
  let phase1 = false;
  let phase1Objective: number[] = [];
  let phase1Iterations: SimplexIteration[] = [];
  let phase1ArtificialValues: number[] = [];
  if (artificialIndexes.length > 0) {
    phase1 = true;
    messages.push("Phase 1 : Minimisation de la somme des variables artificielles.");
    // Fonction objectif auxiliaire : somme des variables artificielles
    phase1Objective = Array(variableNames.length).fill(0);
    artificialIndexes.forEach(idx => { phase1Objective[idx] = 1; });
    // Lancer le simplexe sur cette fonction objectif
    const phase1Result = runSimplex(constraintMatrix, rightHandSide, phase1Objective, variableNames, basisVariables, m, n, true, 1);
    phase1Iterations = phase1Result.iterations;
    // Vérifier la valeur optimale de la phase 1
    const sumArtificial = phase1Result.solutionObj;
    phase1ArtificialValues = artificialIndexes.map(idx => phase1Result.solution[idx]);
    messages.push(`Somme des variables artificielles à la fin de la phase 1 : ${sumArtificial.toFixed(6)}`);
    messages.push(`Valeurs des variables artificielles : [${phase1ArtificialValues.map(v => v.toFixed(6)).join(', ')}]`);
    if (Math.abs(sumArtificial) > EPS) {
      messages.push("❌ Problème irréalisable : la somme des variables artificielles n'est pas nulle à la fin de la phase 1.");
      return {
        isValid: false,
        coordinates: [],
        value: 0,
        tableData: { headers: [], rows: [] },
        iterations: phase1Iterations,
        canonicalForm,
        messages
      };
    }
    // Retirer les variables artificielles de la base et des matrices
    // (On garde seulement les variables originales et d'écart/excès)
    const keepIndexes = variableNames.map((name, idx) => name.startsWith('a') ? -1 : idx).filter(idx => idx !== -1);
    variableNames = keepIndexes.map(idx => variableNames[idx]);
    extendedObjective = keepIndexes.map(idx => extendedObjective[idx]);
    constraintMatrix = constraintMatrix.map(row => keepIndexes.map(idx => row[idx]));
    // Mettre à jour la base : remplacer toute variable artificielle dans la base par une variable non-artificielle si possible
    basisVariables = basisVariables.map(b => b.startsWith('a') ? (variableNames.find(v => !v.startsWith('a')) || b) : b);
    messages.push("✅ Phase 1 terminée : base réalisable trouvée, passage à la phase 2.");
  }

  // --- PHASE 2 : Optimisation réelle ---
  messages.push("Phase 2 : Optimisation de la fonction objectif réelle.");
  const phase2Result = runSimplex(constraintMatrix, rightHandSide, extendedObjective, variableNames, basisVariables, m, variableNames.length, false, 2);
  // Fusionner les itérations des deux phases pour l'affichage
  const allIterations = [...(phase1 ? phase1Iterations : []), ...phase2Result.iterations];
  // Gestion des cas limites
  if (phase2Result.status === 'unbounded') {
    messages.push("❌ Problème non borné : aucune variable ne peut sortir de la base lors d'un pivot.");
    return {
      isValid: false,
      coordinates: [],
      value: 0,
      tableData: { headers: [], rows: [] },
      iterations: allIterations,
      canonicalForm,
      messages
    };
  }
  if (phase2Result.status === 'max-iterations') {
    messages.push("❌ Limite d'itérations atteinte : le problème est peut-être dégénéré ou cyclique.");
    return {
      isValid: false,
      coordinates: [],
      value: 0,
      tableData: { headers: [], rows: [] },
      iterations: allIterations,
      canonicalForm,
      messages
    };
  }
  // Solution optimale trouvée
  messages.push("✅ Solution optimale trouvée en phase 2.");
  return {
    isValid: true,
    coordinates: phase2Result.solution.slice(0, objectiveFunction.length),
    value: Math.abs(phase2Result.solutionObj),
    tableData: { headers: [], rows: [] },
    iterations: allIterations,
    canonicalForm,
    messages
  };
}

// Fonction utilitaire : exécute le simplexe sur un problème donné (tableau, base, etc.)
function runSimplex(
  constraintMatrix: number[][],
  rightHandSide: number[],
  objective: number[],
  variableNames: string[],
  basisVariables: string[],
  m: number,
  n: number,
  isPhase1: boolean,
  phase: number
): { solution: number[]; solutionObj: number; iterations: SimplexIteration[]; status?: string } {
  const EPS = 1e-8;
  const tableau: number[][] = [];
  // Ajouter les lignes de contraintes
  for (let i = 0; i < m; i++) {
    const row = [...constraintMatrix[i], rightHandSide[i]];
    tableau.push(row);
  }
  // Ligne Cj (coefficients de la fonction objectif)
  const cjRow = [...objective, 0];
  tableau.push(cjRow);
  // Ligne Δj (initialement identique à Cj)
  const deltaJRow = [...objective, 0];
  tableau.push(deltaJRow);
  let basis = [...basisVariables];
  let basisCoefficients = basis.map(varName => {
    const index = variableNames.indexOf(varName);
    return index >= 0 ? objective[index] : 0;
  });
  let iteration = 0;
  const maxIterations = 100;
  const iterations: SimplexIteration[] = [];
  // Stocker le tableau initial
  iterations.push({
    iteration: 0,
    tableau: tableau.map(row => [...row]),
    basis: [...basis],
    basisCoefficients: [...basisCoefficients],
    pivot: null,
    isOptimal: false,
    objectiveValue: 0,
    cjRow: [...cjRow],
    deltaJRow: [...deltaJRow],
    variableNames: [...variableNames],
    phase
  });
  while (iteration < maxIterations) {
    // Vérifier la condition d'optimalité
    const deltaJRowIndex = tableau.length - 1;
    let enteringCol = -1;
    let maxPositive = 0;
    for (let j = 0; j < tableau[deltaJRowIndex].length - 1; j++) {
      if (tableau[deltaJRowIndex][j] > maxPositive + EPS) {
        maxPositive = tableau[deltaJRowIndex][j];
        enteringCol = j;
      }
    }
    if (enteringCol === -1 || maxPositive <= EPS) {
      // Solution optimale trouvée
      iterations[iterations.length - 1].isOptimal = true;
      iterations[iterations.length - 1].objectiveValue = -tableau[tableau.length - 1][tableau[0].length - 1];
      break;
    }
    // Test du rapport minimum pour trouver la variable sortante
    let leavingRow = -1;
    let minRatio = Infinity;
    const ratios: number[] = [];
    for (let i = 0; i < m; i++) {
      if (tableau[i][enteringCol] > EPS) {
        const ratio = tableau[i][tableau[i].length - 1] / tableau[i][enteringCol];
        ratios.push(ratio);
        if (ratio >= 0 && ratio < minRatio) {
          minRatio = ratio;
          leavingRow = i;
        }
      } else {
        ratios.push(tableau[i][tableau[i].length - 1] >= 0 ? Infinity : -1);
      }
    }
    if (leavingRow === -1) {
      // Problème non borné
      return {
        solution: Array(n).fill(0),
        solutionObj: 0,
        iterations,
        status: 'unbounded'
      };
    }
    const enteringVariable = variableNames[enteringCol];
    const leavingVariable = basis[leavingRow];
    // Stocker l'itération avec les informations de pivot
    iterations.push({
      iteration: iteration + 1,
      tableau: tableau.map(row => [...row]),
      basis: [...basis],
      basisCoefficients: [...basisCoefficients],
      pivot: { row: leavingRow, col: enteringCol },
      ratios: [...ratios],
      enteringVariable,
      leavingVariable,
      isOptimal: false,
      objectiveValue: -tableau[tableau.length - 1][tableau[0].length - 1],
      cjRow: [...tableau[tableau.length - 2]],
      deltaJRow: [...tableau[tableau.length - 1]],
      variableNames: [...variableNames],
      phase
    });
    // Opérations de pivot
    const pivot = tableau[leavingRow][enteringCol];
    for (let j = 0; j < tableau[leavingRow].length; j++) {
      tableau[leavingRow][j] /= pivot;
    }
    for (let i = 0; i < tableau.length; i++) {
      if (i !== leavingRow) {
        const factor = tableau[i][enteringCol];
        for (let j = 0; j < tableau[i].length; j++) {
          tableau[i][j] -= factor * tableau[leavingRow][j];
        }
      }
    }
    // Mettre à jour la base
    basis[leavingRow] = enteringVariable;
    basisCoefficients[leavingRow] = objective[enteringCol];
    iteration++;
  }
  if (iteration >= maxIterations) {
    return {
      solution: Array(n).fill(0),
      solutionObj: 0,
      iterations,
      status: 'max-iterations'
    };
  }
  // Extraire la solution finale
  const solution = Array(n).fill(0);
  for (let i = 0; i < m; i++) {
    const varName = basis[i];
    const varIndex = variableNames.indexOf(varName);
    if (varIndex < n) {
      solution[varIndex] = tableau[i][tableau[i].length - 1];
    }
  }
  const finalValue = -tableau[tableau.length - 1][tableau[0].length - 1];
  return {
    solution,
    solutionObj: finalValue,
    iterations
  };
}

function generalFormMethod(
  objectiveFunction: number[],
  constraintCoefficients: number[][],
  constraintSigns: ("<=" | "=" | ">=")[],
  constraintValues: number[],
  isMaximization: boolean
): LPSolution {
  // Implémentation de la forme générale avec gestion des contraintes mixtes
  const m = constraintCoefficients.length;
  const n = objectiveFunction.length;
  
  // Convertir en forme standard
  let augmentedMatrix: number[][] = [];
  let slackVars = 0;
  let artificialVars = 0;
  
  // Traiter chaque contrainte
  for (let i = 0; i < m; i++) {
    let row = [...constraintCoefficients[i]];
    
    if (constraintSigns[i] === '<=') {
      // Ajouter variable d'écart
      for (let j = 0; j < m; j++) {
        row.push(j === i ? 1 : 0);
      }
      slackVars++;
    } else if (constraintSigns[i] === '>=') {
      // Ajouter variable d'excès et artificielle
      for (let j = 0; j < m; j++) {
        row.push(j === i ? -1 : 0);
      }
      for (let j = 0; j < m; j++) {
        row.push(j === i ? 1 : 0);
      }
      artificialVars++;
    } else { // '='
      // Ajouter variable artificielle
      for (let j = 0; j < m; j++) {
        row.push(0);
      }
      for (let j = 0; j < m; j++) {
        row.push(j === i ? 1 : 0);
      }
      artificialVars++;
    }
    
    row.push(constraintValues[i]);
    augmentedMatrix.push(row);
  }
  
  // Utiliser la méthode du simplexe sur la matrice augmentée
  return simplexMethod(objectiveFunction, constraintCoefficients, constraintSigns, constraintValues, isMaximization);
}

function isFeasible(point: number[], constraintCoefficients: number[][], constraintSigns: ("<=" | "=" | ">=")[], constraintValues: number[]): boolean {
  for (let i = 0; i < constraintCoefficients.length; i++) {
    const lhs = constraintCoefficients[i][0] * point[0] + constraintCoefficients[i][1] * point[1];
    if (constraintSigns[i] === '<=' && lhs > constraintValues[i] + 1e-8) return false;
    if (constraintSigns[i] === '>=' && lhs < constraintValues[i] - 1e-8) return false;
    if (constraintSigns[i] === '=' && Math.abs(lhs - constraintValues[i]) > 1e-8) return false;
  }
  // x1 >= 0, x2 >= 0
  if (point[0] < -1e-8 || point[1] < -1e-8) return false;
  return true;
}

function intersection2D(a1: number[], b1: number, a2: number[], b2: number): number[] | null {
  // a1[0] * x + a1[1] * y = b1
  // a2[0] * x + a2[1] * y = b2
  const det = a1[0] * a2[1] - a2[0] * a1[1];
  if (Math.abs(det) < 1e-8) return null; // Parallel
  const x = (b1 * a2[1] - b2 * a1[1]) / det;
  const y = (a1[0] * b2 - a2[0] * b1) / det;
  return [x, y];
}

function graphicalMethod(
  objectiveFunction: number[],
  constraintCoefficients: number[][],
  constraintSigns: ("<=" | "=" | ">=")[],
  constraintValues: number[],
  isMaximization: boolean
): LPSolution {
  // Générer tous les points d'intersection et créer le tableau selon le format demandé
  const points: number[][] = [];
  const n = constraintCoefficients.length;
  
  // Créer les données du tableau selon le format de l'image
  const tableRows: string[][] = [];
  
  for (let i = 0; i < n; i++) {
    const coeffs = constraintCoefficients[i];
    const sign = constraintSigns[i];
    const value = constraintValues[i];
    
    // Contrainte originale
    const constraintStr = `${coeffs[0]}x₁ ${coeffs[1] >= 0 ? '+' : ''}${coeffs[1]}x₂ ${sign} ${value}`;
    
    // Équation de la droite (égalité)
    const equationStr = `${coeffs[0]}x₁ ${coeffs[1] >= 0 ? '+' : ''}${coeffs[1]}x₂ = ${value}`;
    
    // Calculer les points d'intersection avec les axes
    const intersectionPoints: string[] = [];
    
    // Intersection avec l'axe x₁ (x₂ = 0)
    if (coeffs[0] !== 0) {
      const x1 = value / coeffs[0];
      if (x1 >= 0) {
        intersectionPoints.push(`(${x1.toFixed(x1 % 1 === 0 ? 0 : 1)}, 0)`);
      }
    }
    
    // Intersection avec l'axe x₂ (x₁ = 0)
    if (coeffs[1] !== 0) {
      const x2 = value / coeffs[1];
      if (x2 >= 0) {
        intersectionPoints.push(`(0, ${x2.toFixed(x2 % 1 === 0 ? 0 : 1)})`);
      }
    }
    
    // Ajouter des points supplémentaires si nécessaire
    while (intersectionPoints.length < 3) {
      intersectionPoints.push('-');
    }
    
    tableRows.push([
      constraintStr,
      equationStr,
      intersectionPoints[0] || '-',
      intersectionPoints[1] || '-',
      intersectionPoints[2] || '-'
    ]);
    
    for (let j = i + 1; j < n; j++) {
      const pt = intersection2D(constraintCoefficients[i], constraintValues[i], constraintCoefficients[j], constraintValues[j]);
      if (pt) points.push(pt);
    }
  }
  
  // Ajouter la ligne pour les contraintes de non-négativité
  tableRows.push([
    'x₁, x₂ ≥ 0',
    'x₁ = 0, x₂ = 0',
    '(0, 0)',
    '-',
    '-'
  ]);
  
  // Intersections avec x1=0 et x2=0
  for (let i = 0; i < n; i++) {
    // x1 = 0
    if (Math.abs(constraintCoefficients[i][0]) > 1e-8) {
      const x2 = (constraintValues[i] - 0) / constraintCoefficients[i][1];
      if (!isNaN(x2)) points.push([0, x2]);
    }
    // x2 = 0
    if (Math.abs(constraintCoefficients[i][1]) > 1e-8) {
      const x1 = (constraintValues[i] - 0) / constraintCoefficients[i][0];
      if (!isNaN(x1)) points.push([x1, 0]);
    }
  }
  // x1=0, x2=0
  points.push([0,0]);

  // Filtrer les points réalisables
  const feasible: number[][] = points.filter(pt => isFeasible(pt, constraintCoefficients, constraintSigns, constraintValues));
  if (feasible.length === 0) {
    return {
      isValid: false,
      coordinates: [],
      value: 0,
      tableData: { headers: [], rows: [] }
    };
  }
  // Ordonner les sommets de la région réalisable pour affichage du polygone
  function orderPolygonVertices(vertices: number[][]): number[][] {
    // Calcul du centroïde
    const cx = vertices.reduce((sum, v) => sum + v[0], 0) / vertices.length;
    const cy = vertices.reduce((sum, v) => sum + v[1], 0) / vertices.length;
    // Trier par angle autour du centroïde
    return vertices.slice().sort((a, b) => {
      const angleA = Math.atan2(a[1] - cy, a[0] - cx);
      const angleB = Math.atan2(b[1] - cy, b[0] - cx);
      return angleA - angleB;
    });
  }
  const feasibleRegion = orderPolygonVertices(feasible);
  // Calculer la valeur de la fonction objectif pour chaque point réalisable
  const values = feasible.map(pt => objectiveFunction[0]*pt[0] + objectiveFunction[1]*pt[1]);
  let idx = 0;
  if (isMaximization) {
    let max = values[0];
    for (let i = 1; i < values.length; i++) if (values[i] > max) { max = values[i]; idx = i; }
  } else {
    let min = values[0];
    for (let i = 1; i < values.length; i++) if (values[i] < min) { min = values[i]; idx = i; }
  }
  return {
    isValid: true,
    coordinates: feasible[idx],
    value: values[idx],
    tableData: {
      headers: ["Contraintes", "Équations des droites", "Point 1", "Point 2", "Point 3"],
      rows: tableRows
    },
    feasibleRegion // <-- ajout pour la visualisation
  };
}

export const solveLPProblem = (problem: LPProblem, method: SolutionMethod = 'graphical'): LPSolution => {
  try {
    let { objectiveFunction, constraintCoefficients, constraintValues, constraintSigns, problemType, objectiveOperator, constraintOperators } = problem;

    // Correction : initialiser constraintOperators si undefined
    if (!constraintOperators) {
      constraintOperators = Array(constraintCoefficients.length).fill('+');
    }
    constraintOperators = constraintOperators as string[];

    // Prise en compte du signe de la fonction objectif
    if (objectiveOperator === '-') {
      objectiveFunction = objectiveFunction.map((c, i) => i === 0 ? c : -Math.abs(c));
    }
    // Par défaut ou +, on garde les coefficients tels quels

    // Prise en compte des signes dans les contraintes
      constraintCoefficients = constraintCoefficients.map((row, i) =>
      constraintOperators![i] === '-' ? row.map((c, j) => j === 0 ? c : -Math.abs(c)) : row
      );

    if (method === 'graphical' && objectiveFunction.length === 2) {
      return graphicalMethod(
        objectiveFunction,
        constraintCoefficients,
        constraintSigns,
        constraintValues,
        problemType === 'max'
      );
    }
    
    if (method === 'simplex') {
      return simplexMethod(
        objectiveFunction,
        constraintCoefficients,
        constraintSigns,
        constraintValues,
        problemType === 'max'
      );
    }
    
    if (method === 'general') {
      return generalFormMethod(
        objectiveFunction,
        constraintCoefficients,
        constraintSigns,
        constraintValues,
        problemType === 'max'
      );
    }
    
    // Par défaut, utiliser la méthode graphique pour 2 variables, sinon simplexe
    if (objectiveFunction.length === 2) {
      return graphicalMethod(
        objectiveFunction,
        constraintCoefficients,
        constraintSigns,
        constraintValues,
        problemType === 'max'
      );
    } else {
      return simplexMethod(
        objectiveFunction,
        constraintCoefficients,
        constraintSigns,
        constraintValues,
        problemType === 'max'
      );
    }
  } catch (error) {
    console.error('Error solving LP problem:', error);
    return {
      isValid: false,
      coordinates: [],
      value: 0,
      tableData: { headers: [], rows: [] }
    };
  }
};