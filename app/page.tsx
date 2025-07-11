"use client"

import { useState } from 'react'
import { LPForm } from '@/components/lp-form'
import { ResultsTable } from '@/components/results-table'
import { LPVisualization } from '@/components/lp-visualization'
import { MethodSelector } from '@/components/method-selector'
import { solveLPProblem, type LPProblem, type LPSolution } from '@/lib/lp-solver'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModeToggle } from '@/components/mode-toggle'
import { CalculatorIcon, LineChartIcon, TableIcon, SparklesIcon } from 'lucide-react'

export type SolutionMethod = 'graphical' | 'simplex' | 'general'

export default function Home() {
  const [solution, setSolution] = useState<LPSolution | null>(null)
  const [problem, setProblem] = useState<LPProblem | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<SolutionMethod>('graphical')
  
  const handleSolve = (formData: LPProblem) => {
    setProblem(formData)
    const result = solveLPProblem(formData, selectedMethod)
    // Si méthode simplexe et problème à 2 variables, on récupère aussi la région réalisable
    if (selectedMethod === 'simplex' && formData.objectiveFunction.length === 2) {
      const graphical = solveLPProblem(formData, 'graphical')
      setSolution({ ...result, feasibleRegion: graphical.feasibleRegion })
    } else {
      setSolution(result)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header moderne avec effet glassmorphism */}
      <header className="sticky top-0 z-50 w-full glass-effect border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500">
              <CalculatorIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">
                Freecampcoding
              </h1>
              <p className="text-xs text-blue-200/70">
                Résolution de Programmation Linéaire
              </p>
            </div>
          </div>
          <ModeToggle />
        </div>
      </header>

      <div className="container mx-auto py-8 px-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h2 className="text-4xl font-bold gradient-text">
            Résolvez vos problèmes de programmation linéaire
          </h2>
          <p className="text-blue-200/80 text-lg max-w-2xl mx-auto">
            Utilisez notre solveur avancé avec visualisation graphique, méthode du simplexe et forme générale
          </p>
        </div>

        {/* Sélecteur de méthode */}
        <MethodSelector 
          selectedMethod={selectedMethod} 
          onMethodChange={setSelectedMethod} 
        />

        {/* Formulaire principal */}
        <div className="modern-card p-8">
          <LPForm onSolve={handleSolve} selectedMethod={selectedMethod} />
        </div>
        
        {/* Résultats */}
        {solution && (
          <div className="space-y-6">
            {solution.isValid ? (
              <>
                {/* Résumé de la solution */}
                <Card className="modern-card border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <SparklesIcon className="h-6 w-6 text-green-400" />
                      <h3 className="text-xl font-bold text-green-400">Solution Optimale Trouvée</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm text-blue-200/70">Point optimal :</p>
                        <p className="text-lg font-mono text-white">
                          ({solution.coordinates.map(c => c.toFixed(3)).join(', ')})
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-blue-200/70">Valeur optimale :</p>
                        <p className="text-2xl font-bold text-green-400">
                          Z = {solution.value.toFixed(3)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Onglets pour les résultats */}
                <Tabs defaultValue="visualization" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 glass-effect">
                    <TabsTrigger value="visualization" className="flex items-center space-x-2">
                      <LineChartIcon className="h-4 w-4" />
                      <span>Visualisation</span>
                    </TabsTrigger>
                    <TabsTrigger value="table" className="flex items-center space-x-2">
                      <TableIcon className="h-4 w-4" />
                      <span>Tableau {selectedMethod === 'simplex' ? 'Simplexe' : 'Résultats'}</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="visualization" className="mt-6">
                    {problem && solution && (
                      problem.objectiveFunction.length === 2 ? (
                        <LPVisualization
                          constraints={{
                            coefficients: problem.constraintCoefficients,
                            signs: problem.constraintSigns,
                            values: problem.constraintValues
                          }}
                          objectiveFunction={problem.objectiveFunction}
                          problemType={problem.problemType}
                          solution={solution}
                          method={selectedMethod}
                        />
                      ) : (
                        <div className="p-4 glass-effect rounded-xl border border-yellow-500/20">
                          <p className="text-yellow-300">
                            ⚠️ La visualisation graphique n'est disponible que pour les problèmes à 2 variables.
                          </p>
                        </div>
                      )
                    )}
                  </TabsContent>
                  
                  <TabsContent value="table" className="mt-6">
                    {solution.tableData && (
                      <ResultsTable 
                        tableData={solution.tableData} 
                        method={selectedMethod}
                        iterations={solution.iterations}
                        canonicalForm={solution.canonicalForm}
                      />
                    )}
                  </TabsContent>
                </Tabs>

                {/* Explication détaillée */}
                <Card className="modern-card">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4 gradient-text">
                      Explication de la Résolution ({selectedMethod === 'graphical' ? 'Méthode Graphique' : 
                                                    selectedMethod === 'simplex' ? 'Méthode du Simplexe' : 
                                                    'Forme Générale'})
                    </h3>
                    <div className="space-y-4 text-blue-100/90">
                      <div>
                        <h4 className="font-semibold mb-2 text-blue-300">1. Formulation du Problème</h4>
                        <p>Fonction objectif : {problem?.problemType === 'max' ? 'Maximiser' : 'Minimiser'} Z = 
                          {problem?.objectiveFunction.map((coeff, idx) => 
                            ` ${coeff >= 0 && idx > 0 ? '+' : ''} ${coeff}x${idx + 1}`
                          )}
                        </p>
                        <p className="mt-2">Sous les contraintes :</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          {problem?.constraintCoefficients.map((coeffs, idx) => (
                            <li key={idx} className="font-mono text-sm">
                              {coeffs.map((coeff, cIdx) => 
                                `${coeff >= 0 && cIdx > 0 ? '+' : ''} ${coeff}x${cIdx + 1}`
                              ).join('')} {problem.constraintSigns[idx]} {problem.constraintValues[idx]}
                            </li>
                          ))}
                          <li>x₁, x₂ ≥ 0</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-blue-300">2. Méthode de Résolution</h4>
                        {selectedMethod === 'graphical' && (
                          <p>La méthode graphique trouve la solution en identifiant les points d'intersection des contraintes et en évaluant la fonction objectif à chaque sommet de la région réalisable.</p>
                        )}
                        {selectedMethod === 'simplex' && (
                          <p>La méthode du simplexe utilise un algorithme itératif qui se déplace de sommet en sommet de la région réalisable jusqu'à trouver la solution optimale.</p>
                        )}
                        {selectedMethod === 'general' && (
                          <p>La forme générale traite le problème en utilisant une approche matricielle complète pour gérer tous types de contraintes.</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-blue-300">3. Interprétation</h4>
                        <p>Pour {problem?.problemType === 'max' ? 'maximiser' : 'minimiser'} la fonction objectif :</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          {solution.coordinates.map((coord, idx) => (
                            <li key={idx}>Produire {coord.toFixed(3)} unités de x{idx + 1}</li>
                          ))}
                          <li className="font-semibold text-green-400">
                            Valeur optimale : {solution.value.toFixed(3)}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="modern-card border-red-500/20">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <h3 className="text-xl font-bold text-red-400">Aucune Solution Trouvée</h3>
                    <p className="text-red-300/80">
                      Le problème n'a pas de solution réalisable ou est non borné. 
                      Veuillez vérifier vos contraintes et réessayer.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}