"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { SolutionMethod } from '@/app/page'
import type { SimplexIteration, CanonicalForm } from '@/lib/lp-solver'

type TableData = {
  tableData: {
    headers: string[]
    rows: string[][]
  }
  method: SolutionMethod
  iterations?: SimplexIteration[]
  canonicalForm?: CanonicalForm
}

export function ResultsTable({ tableData, method, iterations, canonicalForm }: TableData) {
  const { headers, rows } = tableData
  
  // Pour la méthode simplexe, afficher la forme canonique et toutes les itérations
  if (method === 'simplex' && iterations && canonicalForm) {
    return (
      <div className="space-y-8">
        {/* Forme Canonique */}
        <Card className="modern-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-300 rounded-full"></div>
            <h3 className="text-xl font-bold gradient-text">
              Étape 1: Conversion en Forme Canonique
            </h3>
          </div>
          
          <div className="space-y-4">
            {canonicalForm.explanation.map((line, index) => (
              <p key={index} className="text-blue-100/90 font-mono text-sm">
                {line}
              </p>
            ))}
            
            <div className="mt-6 p-4 glass-effect rounded-xl border border-green-500/20">
              <h4 className="text-lg font-semibold mb-3 text-green-400">📊 Matrice du Système</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-green-500/30">
                      {canonicalForm.variableNames.map((varName, index) => (
                        <TableHead key={index} className="text-center font-bold text-green-300 bg-green-900/20">
                          {varName}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-bold text-green-300 bg-green-900/20">
                        A0
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {canonicalForm.constraintMatrix.map((row, rowIndex) => (
                      <TableRow key={rowIndex} className="hover:bg-green-500/10 border-b border-green-500/20">
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex} className="text-center text-white font-mono bg-green-900/10">
                            {cell}
                          </TableCell>
                        ))}
                        <TableCell className="text-center text-green-300 font-mono bg-green-900/10">
                          {canonicalForm.rightHandSide[rowIndex]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-200/80">
                  <strong>Base initiale:</strong> {canonicalForm.basisVariables.join(', ')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tableaux du Simplexe */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold gradient-text text-center">
            Étape 2: Application de l'Algorithme du Simplexe
          </h3>
          
          {iterations.map((iteration, index) => (
            <Card key={index} className="modern-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"></div>
                  <h3 className="text-xl font-bold gradient-text">
                    {index === 0 ? 'Tableau Initial du Simplexe' : `Itération ${iteration.iteration}`}
                  </h3>
                </div>
                {iteration.isOptimal && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Solution Optimale
                  </Badge>
                )}
              </div>

              {/* Informations sur l'itération */}
              {iteration.pivot && (
                <div className="mb-4 p-4 glass-effect rounded-xl border border-blue-500/20">
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-300 font-medium">Variable entrante:</span>
                      <p className="text-green-400 font-mono">{iteration.enteringVariable}</p>
                    </div>
                    <div>
                      <span className="text-blue-300 font-medium">Variable sortante:</span>
                      <p className="text-red-400 font-mono">{iteration.leavingVariable}</p>
                    </div>
                    <div>
                      <span className="text-blue-300 font-medium">Élément pivot:</span>
                      <p className="text-yellow-400 font-mono">
                        a[{iteration.pivot.row + 1}][{iteration.pivot.col + 1}] = {iteration.tableau[iteration.pivot.row][iteration.pivot.col].toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-300 font-medium">Valeur Z:</span>
                      <p className="text-purple-400 font-mono">Z = {iteration.objectiveValue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tableau simplexe principal */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-blue-500/30">
                      <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                        Ci
                      </TableHead>
                      <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                        i
                      </TableHead>
                      {iteration.variableNames.map((varName, i) => (
                        <TableHead key={i} className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                          {varName}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                        A0
                      </TableHead>
                      {iteration.ratios && (
                        <TableHead className="text-center font-bold text-orange-300 bg-orange-900/20">
                          xi / xij
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Lignes des contraintes */}
                    {iteration.tableau.slice(0, -2).map((row, rowIndex) => (
                      <TableRow key={rowIndex} className="hover:bg-blue-500/10 border-b border-blue-500/20">
                        <TableCell className="text-center text-white font-mono bg-blue-900/10 border-r border-blue-500/20">
                          {iteration.basisCoefficients[rowIndex].toFixed(0)}
                        </TableCell>
                        <TableCell className="text-center text-cyan-300 font-mono bg-blue-900/10 border-r border-blue-500/20">
                          {iteration.basis[rowIndex]}
                        </TableCell>
                        {row.slice(0, -1).map((cell, cellIndex) => (
                          <TableCell 
                            key={cellIndex} 
                            className={`text-center font-mono border-r border-blue-500/20 ${
                              iteration.pivot && 
                              iteration.pivot.row === rowIndex && 
                              iteration.pivot.col === cellIndex
                                ? 'bg-yellow-500/20 text-yellow-300 font-bold'
                                : 'text-white bg-blue-900/10'
                            }`}
                          >
                            {cell.toFixed(2)}
                          </TableCell>
                        ))}
                        <TableCell className="text-center text-white font-mono bg-blue-900/10 border-r border-blue-500/20">
                          {row[row.length - 1].toFixed(2)}
                        </TableCell>
                        {iteration.ratios && (
                          <TableCell className="text-center text-orange-300 font-mono bg-orange-900/10">
                            {iteration.ratios[rowIndex] === Infinity ? '∞' : 
                             iteration.ratios[rowIndex] < 0 ? '-' :
                             iteration.ratios[rowIndex].toFixed(2)}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    
                    {/* Ligne Cj */}
                    <TableRow className="bg-green-900/20 border-b border-green-500/30">
                      <TableCell className="text-center text-green-300 font-bold border-r border-blue-500/20">
                        Cj
                      </TableCell>
                      <TableCell className="text-center border-r border-blue-500/20"></TableCell>
                      {iteration.cjRow.slice(0, -1).map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="text-center text-green-300 font-mono border-r border-blue-500/20">
                          {cell.toFixed(0)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center text-green-300 font-mono border-r border-blue-500/20">
                        {iteration.cjRow[iteration.cjRow.length - 1].toFixed(0)}
                      </TableCell>
                      {iteration.ratios && (
                        <TableCell className="text-center border-r border-blue-500/20"></TableCell>
                      )}
                    </TableRow>
                    
                    {/* Ligne Δj */}
                    <TableRow className="bg-purple-900/20">
                      <TableCell className="text-center text-purple-300 font-bold border-r border-blue-500/20">
                        Δj
                      </TableCell>
                      <TableCell className="text-center border-r border-blue-500/20"></TableCell>
                      {iteration.deltaJRow.slice(0, -1).map((cell, cellIndex) => (
                        <TableCell 
                          key={cellIndex} 
                          className={`text-center font-mono border-r border-blue-500/20 ${
                            cell > 0 ? 'text-red-300 font-bold' : 'text-purple-300'
                          }`}
                        >
                          {cell.toFixed(2)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center text-purple-300 font-mono border-r border-blue-500/20">
                        Z = {(-iteration.deltaJRow[iteration.deltaJRow.length - 1]).toFixed(2)}
                      </TableCell>
                      {iteration.ratios && (
                        <TableCell className="text-center border-r border-blue-500/20"></TableCell>
                      )}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Explication des transformations */}
              {iteration.pivot && !iteration.isOptimal && (
                <div className="mt-4 p-4 glass-effect rounded-xl border border-blue-500/20">
                  <h4 className="text-lg font-semibold mb-2 text-blue-300">📝 Transformations Appliquées</h4>
                  <div className="space-y-2 text-sm text-blue-200/80">
                    <p><strong>F1:</strong> Nouvelle ligne pivot: x_ir = x_ir/a_ij, x_i = x_i/a_ij</p>
                    <p><strong>F2:</strong> Autres lignes: x_kr = x_kr - x_kj(x_ir/a_ij)</p>
                    <p><strong>F3:</strong> Fonction objectif: Z = Z + (x_i/a_ij) × Δj</p>
                  </div>
                </div>
              )}

              {iteration.isOptimal && (
                <div className="mt-4 p-4 glass-effect rounded-xl border border-green-500/20">
                  <h4 className="text-lg font-semibold mb-2 text-green-400">✅ Solution Optimale Atteinte</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-300/80 mb-2">
                        Tous les coefficients Δj ≤ 0. La solution optimale est trouvée.
                      </p>
                      <p className="text-lg font-bold text-green-400">
                        Valeur optimale: Z = {iteration.objectiveValue.toFixed(3)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-300/80 mb-2">Variables de base:</p>
                      <ul className="space-y-1">
                        {iteration.basis.map((varName, i) => (
                          <li key={i} className="text-sm font-mono text-white">
                            {varName} = {iteration.tableau[i][iteration.tableau[i].length - 1].toFixed(3)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Pour la méthode graphique
  if (method === 'graphical') {
    return (
      <Card className="modern-card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"></div>
          <h2 className="text-2xl font-bold gradient-text">
            Résolution graphique - Tableau des Points
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-blue-500/30">
                <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                  Contraintes
                </TableHead>
                <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                  Équations des droites
                </TableHead>
                <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                  Point 1
                </TableHead>
                <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20 border-r border-blue-500/30">
                  Point 2
                </TableHead>
                <TableHead className="text-center font-bold text-blue-300 bg-blue-900/20">
                  Point 3
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-blue-500/10 border-b border-blue-500/20">
                  <TableCell className="text-center text-white font-mono bg-blue-900/10 border-r border-blue-500/20 font-medium">
                    {row[0]}
                  </TableCell>
                  <TableCell className="text-center text-cyan-300 font-mono bg-blue-900/10 border-r border-blue-500/20">
                    {row[1]}
                  </TableCell>
                  <TableCell className="text-center text-green-300 font-mono bg-blue-900/10 border-r border-blue-500/20">
                    {row[2]}
                  </TableCell>
                  <TableCell className="text-center text-green-300 font-mono bg-blue-900/10 border-r border-blue-500/20">
                    {row[3] || '-'}
                  </TableCell>
                  <TableCell className="text-center text-green-300 font-mono bg-blue-900/10">
                    {row[4] || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 p-4 glass-effect rounded-xl border border-blue-500/20">
          <h3 className="text-lg font-semibold mb-2 text-blue-300">📝 Explication</h3>
          <p className="text-sm text-blue-200/80">
            Ce tableau présente les contraintes du problème, leurs équations de droites correspondantes, 
            et les points d'intersection calculés pour déterminer la région réalisable.
          </p>
        </div>
      </Card>
    )
  }

  // Format standard pour les autres méthodes
  return (
    <Card className="modern-card p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"></div>
        <h2 className="text-2xl font-bold gradient-text">
          {method === 'simplex' ? 'Tableau du Simplexe' : 
           method === 'general' ? 'Résultats Forme Générale' : 'Tableau des Résultats'}
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index} className="text-center whitespace-nowrap text-blue-300 font-semibold">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-blue-500/10">
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} className="text-center text-white font-mono">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}