import fs from 'fs-extra'
import path from 'path'

interface Projection {
    code: string
    name: string
    region: string
    proj4: string
    url: string
    wgs84bounds: number[]
}

interface MarkerConfig {
    name: string
    iconColor: string
    markerColor: string
    iconName: string
    shape: string
}

// Définition des couleurs par région ou groupe de régions
const getRegionColor = (region: string): string => {
    // Couleurs globales
    if (region === 'World') return '#1E88E5'  // Bleu clair

    // Europe
    if (region === 'Europe') return '#0D47A1'  // Bleu foncé
    if (region === 'France') return '#1565C0'  // Bleu France
    if (['Belgium', 'Luxembourg', 'Ireland', 'Italy', 'Spain'].includes(region)) return '#1976D2'  // Bleu Europe

    // Territoires français d'outre-mer
    if (['Guadeloupe', 'Martinique', 'Guiana', 'Reunion', 'Mayotte', 'New Caledonia', 'Polynesia'].includes(region)) 
        return '#0277BD'  // Bleu outre-mer

    // Amérique du Nord
    if (region === 'North America') return '#D32F2F'  // Rouge foncé
    if (region === 'USA') return '#E53935'  // Rouge USA
    if (region === 'Canada') return '#EF5350'  // Rouge clair

    // Afrique du Nord
    if (region === 'Algeria') return '#43A047'  // Vert
    if (region === 'Tunisia') return '#2E7D32'  // Vert foncé
    if (region === 'Morocco') return '#66BB6A'  // Vert clair
    if (region === 'Western Sahara') return '#81C784'  // Vert très clair

    return '#757575'  // Gris par défaut
}

const getRegionsFromProjections = () => {
    const projectionsPath = path.join(__dirname, '..', 'src', 'assets', 'projections.json')
    const projections: Projection[] = JSON.parse(fs.readFileSync(projectionsPath, 'utf-8'))

    // Extraire les régions uniques
    const uniqueRegions = [...new Set(projections.map(proj => proj.region))]
    console.log('Régions trouvées:', uniqueRegions)

    return uniqueRegions
}

// Exécuter la fonction
getRegionsFromProjections()