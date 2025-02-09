import fs from 'fs-extra'
import path from 'path'
import * as cheerio from 'cheerio'
import { parseString } from 'xml2js'
import svgRender from 'svg-render'
import Spritesmith from 'spritesmith'


const iconsSvgDir = path.join(__dirname, '..', 'resources', 'IconsSVG')
const markersModelPath = path.join(__dirname, '..', 'resources', 'markersModel')
const assetsDir = path.join(__dirname, '..', 'src', 'assets')


const configMarkers = [ 
    // Projections mondiales
    { "name": "World", "iconColor": '#FFFFFF', "markerColor": '#2196F3', "iconName": "maki-circle", "shape": "circle" },  // Bleu ONU
    { "name": "Europe", "iconColor": '#FFD700', "markerColor": '#003399', "iconName": "maki-circle", "shape": "circle" },  // Bleu et or du drapeau européen

    // France et territoires (bleu-blanc-rouge)
    { "name": "France", "iconColor": '#FFFFFF', "markerColor": '#002395', "iconName": "maki-circle", "shape": "circle" },  // Bleu France
    { "name": "Guadeloupe", "iconColor": '#FFFFFF', "markerColor": '#002395', "iconName": "maki-circle", "shape": "circle" },  // Bleu France
    { "name": "Martinique", "iconColor": '#FFFFFF', "markerColor": '#002395', "iconName": "maki-circle", "shape": "circle" },  // Bleu France
    { "name": "Guiana", "iconColor": '#FFFFFF', "markerColor": '#002395', "iconName": "maki-circle", "shape": "circle" },  // Bleu France
    { "name": "Reunion", "iconColor": '#FFFFFF', "markerColor": '#002395', "iconName": "maki-circle", "shape": "circle" },  // Bleu France
    { "name": "Mayotte", "iconColor": '#FFFFFF', "markerColor": '#002395', "iconName": "maki-circle", "shape": "circle" },  // Bleu France
    { "name": "Polynesia", "iconColor": '#FFFFFF', "markerColor": '#002395', "iconName": "maki-circle", "shape": "circle" },  // Bleu France
    { "name": "New Caledonia", "iconColor": '#FFFFFF', "markerColor": '#002395', "iconName": "maki-circle", "shape": "circle" },  // Bleu France

    // Pays européens
    { "name": "Belgium", "iconColor": '#FFD617', "markerColor": '#000000', "iconName": "maki-circle", "shape": "circle" },  // Noir et or du drapeau belge
    { "name": "Luxembourg", "iconColor": '#FFFFFF', "markerColor": '#00A3E0', "iconName": "maki-circle", "shape": "circle" },  // Bleu Luxembourg
    { "name": "Ireland", "iconColor": '#FFFFFF', "markerColor": '#169B62', "iconName": "maki-circle", "shape": "circle" },  // Vert Irlande
    { "name": "Italy", "iconColor": '#FFFFFF', "markerColor": '#008C45', "iconName": "maki-circle", "shape": "circle" },  // Vert Italie
    { "name": "Spain", "iconColor": '#FFFF00', "markerColor": '#AA151B', "iconName": "maki-circle", "shape": "circle" },  // Rouge et jaune Espagne

    // Amérique du Nord
    { "name": "North America", "iconColor": '#FFFFFF', "markerColor": '#B31942', "iconName": "maki-circle", "shape": "circle" },  // Rouge USA
    { "name": "USA", "iconColor": '#FFFFFF', "markerColor": '#B31942', "iconName": "maki-circle", "shape": "circle" },  // Rouge USA
    { "name": "Canada", "iconColor": '#FFFFFF', "markerColor": '#FF0000', "iconName": "maki-circle", "shape": "circle" },  // Rouge Canada

    // Afrique du Nord
    { "name": "Algeria", "iconColor": '#FFFFFF', "markerColor": '#006233', "iconName": "maki-circle", "shape": "circle" },  // Vert Algérie
    { "name": "Tunisia", "iconColor": '#FFFFFF', "markerColor": '#E70013', "iconName": "maki-circle", "shape": "circle" },  // Rouge Tunisie
    { "name": "Morocco", "iconColor": '#FFFFFF', "markerColor": '#C1272D', "iconName": "maki-circle", "shape": "circle" },  // Rouge Maroc
    { "name": "Western Sahara", "iconColor": '#FFFFFF', "markerColor": '#007A3D', "iconName": "maki-circle", "shape": "circle" },  // Vert du drapeau
]

const whiteList: string[] = []

export const generateSprites = () => {
    const iconsUsed: string[] = []
    const markerUsed: string[] = []


    const outputTmp = path.join(__dirname, 'tmp')
    const outputFolderSVG = path.join(outputTmp, 'SVG')

    const outPath = path.join(assetsDir, 'map-styles', 'sprites') // les sprites en sorti
    const outPathIconSprites = path.join(assetsDir) // les sprites en sorti

    fs.removeSync(outputTmp)
    fs.mkdirsSync(outputFolderSVG)

    let iconsSVG: string[] = []

    const generateMarkerIcon = (
        iconName: string,
        colorIcon: string,
        colorMarker: string,
        shape = 'circle',
        spriteName: string = iconName,
    ) => {
 

        let iconSVG: string
        let pathMarkerXMLCircle: string | undefined
        let pathMarkerXMLSquare: string | undefined

        iconSVG = fs
            .readFileSync(path.join(iconsSvgDir, iconName + '.svg'))
            .toString()
        

        parseString(
            fs
                .readFileSync(path.join(markersModelPath, 'marker-circle.svg'))
                .toString(),
            function (err, result) {
                pathMarkerXMLCircle =
                    '<path fill="' +
                    colorMarker +
                    '" d="' +
                    result.svg.path[0].$.d +
                    '"></path>'
            }
        )

        const pathMarkerXMLPenta =
            '<polygon fill="' +
            colorMarker +
            '" points="12,36 24,12 18,0 6.017,0 0,12.016 "/>'

        parseString(
            fs
                .readFileSync(path.join(markersModelPath, 'marker-square.svg'))
                .toString(),
            function (err, result) {
                pathMarkerXMLSquare =
                    '<path fill="' +
                    colorMarker +
                    '" d="' +
                    result.svg.path[0].$.d +
                    '"></path>'
            }
        )

        let $ = cheerio.load(iconSVG)
        let pathIconXMLstr = ''

        let width: number = 0
        let height: number = 0
        $('svg').attr('width', (a, b) => {
            width = Number(b.replace('px', ''))
            return width + 'px'
        })

        $('svg').attr('height', (a, b) => {
            height = Number(b.replace('px', ''))
            return height + 'px'
        })

        const translateX = 4.5 + (15 - width) / 2 // width - 11.5
        const translateY = 4.5 + (15 - height) / 2

        $('path').attr('d', function (a, b) {
            pathIconXMLstr += `<path fill='${colorIcon}' transform='translate(${translateX} ${translateY})' d='${b}'></path> `
            return pathIconXMLstr
        })
        const iconDpath = $('path').attr('d')

        if (iconsSVG.indexOf(iconName) == -1) {
            iconsSVG.push(iconName)
        }

        const xmlHeader =
            '<?xml version="1.0" encoding="utf-8"?> <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
            '<svg version="1.1" id="marker-circle-blue" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"  y="0px" width="24px" height="36px" viewBox="0 0 24 36" enable-background="new 0 0 24 36" xml:space="preserve">'

        const xmlEnd = '</svg>'

        if (shape == 'circle') {
                const SVGcircle =
                    xmlHeader + pathMarkerXMLCircle + pathIconXMLstr + xmlEnd
                fs.writeFileSync(
                    path.join(outputFolderSVG, spriteName + '.svg'),
                    SVGcircle
                )
            
        }

        if (shape == 'penta') {
                const SVGpenta =
                    xmlHeader + pathMarkerXMLPenta + pathIconXMLstr + xmlEnd
                fs.writeFileSync(
                    path.join(outputFolderSVG, spriteName + '.svg'),
                    SVGpenta
                )
           
        }
        if (shape == 'square') {
                const SVGsquare =
                    xmlHeader + pathMarkerXMLSquare + pathIconXMLstr + xmlEnd
                fs.writeFileSync(
                    path.join(outputFolderSVG, spriteName + '.svg'),
                    SVGsquare
                )
            
        }
    }


    

    console.log('génération des markers')
    let iconsMarkersStr = []

    for (const configMarker of configMarkers) {
        generateMarkerIcon(
            configMarker.iconName,
            configMarker.iconColor,
            configMarker.markerColor,
            configMarker.shape,
            configMarker.name
        )
    }

    // Créer les dossiers de destination s'ils n'existent pas
    fs.mkdirpSync(outPath)
    fs.mkdirpSync(outPathIconSprites)

    console.log('génération des sprites')

    for (let i = 0; i < whiteList.length; i++) {
        fs.copySync(
            path.join(iconsSvgDir, whiteList[i] + '.svg'),
            path.join(outputFolderSVG, whiteList[i] + '.svg')
        )
    }

    const svgNames = fs.readdirSync(outputFolderSVG)
    // filtrer que les SVG
    const sizeOf = require('image-size')

    const svgToPNG = async (filePath: string, factor: number) => {
        const dimensions = sizeOf(filePath)
        const svgBuffer = fs.readFileSync(filePath)

        return await svgRender({
            buffer: svgBuffer,
            width: dimensions.width * factor,
            height: dimensions.height * factor,
        })
    }

    const generateSprites = async (outPath: string, factor = 1) => {
        const pngFolder = path.join(outputTmp, 'PNG', `@${factor}`)
        await fs.emptyDir(pngFolder)
        console.log(factor)
        console.log('length', svgNames.length)
        for (const svgFileName of svgNames) {
            const filePath = path.join(outputFolderSVG, svgFileName)
            const image = await svgToPNG(filePath, factor)

            fs.writeFileSync(path.join(pngFolder, `${svgFileName}.png`), image)
        }

        const pngsNameFile = fs.readdirSync(pngFolder)
        const pngPaths = pngsNameFile.map((n) => path.join(pngFolder, n))
        var sprites = pngPaths

        return new Promise((resolve, reject) => {
            Spritesmith.run(
                { src: sprites },
                async function handleResult(err, result) {
                    if (err) {
                        reject(err)
                    }

                    const outFileName =
                        factor === 1 ? 'projection' : `projection@${factor}x`
                    fs.writeFileSync(
                        path.join(outPath, outFileName + '.png'),
                        result.image
                    )
                    // await sharp(result.image).toFile(path.join(outPath, outFileName + '.png'))

                    const jsonSprites: any = {}
                    for (const k in result.coordinates) {
                        const basename = path
                            .basename(k)
                            .replace('.svg.png', '')
                        jsonSprites[basename] = {
                            ...result.coordinates[k],
                            pixelRatio: factor,
                        }
                    }
                    fs.writeFileSync(
                        path.join(outPath, outFileName + '.json'),
                        JSON.stringify(jsonSprites)
                    )
                    await fs.remove(pngFolder)

                    resolve({
                        json: path.join(outPath, outFileName + '.json'),
                        png: path.join(outPath, outFileName + '.png'),
                    })
                }
            )
        })
    }



    return Promise.all([
        generateSprites(outPath, 1),
        generateSprites(outPath, 2),
    ]).then((e) => {
        console.log('END')
        fs.removeSync(outputTmp)
    })
}

generateSprites()
    .then(() => {
        console.log('END')
    }).catch((e) => {
        console.error(e)
    })
