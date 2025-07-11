"use client"

import { Card, CardContent } from '@/components/ui/card'
import { LineChartIcon, CalculatorIcon, GridIcon } from 'lucide-react'
import type { SolutionMethod } from '@/app/page'

type MethodSelectorProps = {
  selectedMethod: SolutionMethod
  onMethodChange: (method: SolutionMethod) => void
}

export function MethodSelector({ selectedMethod, onMethodChange }: MethodSelectorProps) {
  const methods = [
    {
      id: 'graphical' as SolutionMethod,
      title: 'Méthode Graphique',
      description: 'Visualisation 2D pour problèmes à 2 variables',
      icon: LineChartIcon,
      features: ['Visualisation intuitive', 'Idéal pour l\'apprentissage', 'Limité à 2 variables']
    },
    {
      id: 'simplex' as SolutionMethod,
      title: 'Algorithme du Simplexe',
      description: 'Méthode classique pour tous types de problèmes',
      icon: CalculatorIcon,
      features: ['Algorithme robuste', 'Tableau détaillé', 'N variables']
    },
    {
      id: 'general' as SolutionMethod,
      title: 'Forme Générale',
      description: 'Approche matricielle complète',
      icon: GridIcon,
      features: ['Forme matricielle', 'Contraintes complexes', 'Solution générale']
    }
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-center gradient-text">
        Choisissez votre méthode de résolution
      </h3>
      <div className="grid md:grid-cols-3 gap-6">
        {methods.map((method) => {
          const Icon = method.icon
          const isSelected = selectedMethod === method.id
          
          return (
            <Card
              key={method.id}
              className={`method-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onMethodChange(method.id)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl ${isSelected ? 'bg-blue-500' : 'bg-blue-500/20'}`}>
                      <Icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                        {method.title}
                      </h4>
                    </div>
                  </div>
                  
                  <p className="text-sm text-blue-200/70">
                    {method.description}
                  </p>
                  
                  <ul className="space-y-1">
                    {method.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-blue-300/60 flex items-center space-x-2">
                        <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {isSelected && (
                    <div className="pt-2 border-t border-blue-500/20">
                      <span className="text-xs font-medium text-blue-300">✓ Méthode sélectionnée</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}