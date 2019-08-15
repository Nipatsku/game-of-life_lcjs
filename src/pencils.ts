import { GameOfLife } from "./gameOfLife";

// File contains different "Pencils" for drawing Game of Life cells in a fast and easy manner.
// There exists a vast collection of community-created patterns, that can have simply beautiful life-cycles, or perform complex mutations.

export type PencilPattern = boolean[][]
export interface Pencil {
    label: string,
    draggable: boolean,
    patterns: PencilPattern | { label: string, pattern: PencilPattern }[]
}
// TODO: Add rotation parameter
/**
 * Sick pattern rotation logic made by Chicken man Lucas Yap.
 * @param   pattern Pattern to rotate
 * @param   count   Amount of times to rotate **clock-wise**
 */
const rotatePattern = (pattern: PencilPattern, count: number): PencilPattern => {
    const arrLength = pattern[0].length
    const numArrs = pattern.length - 1
    const result = []
    for (let i = 0; i < arrLength; i ++)
        result[i] = []

    for (let elementIndex = 0; elementIndex < arrLength; elementIndex ++) {
        for (let arrIndex = 0; arrIndex < pattern.length; arrIndex ++) {
            result[elementIndex][numArrs - arrIndex] = pattern[arrIndex][elementIndex]
        }
    }
    return (count > 1) ? rotatePattern(result, count - 1) : result
}
/**
 * @param gameOfLife 
 * @param pattern 
 * @param col 
 * @param row    
 * @param state         Cell state to apply
 */
export const applyPencilPattern = (gameOfLife: GameOfLife, pattern: PencilPattern, col: number, row: number, state: boolean | undefined) => {
    const patternWidth = pattern.reduce((prev, cur) => Math.max(prev, cur.length), 0)
    const patternHeight = pattern.length

    for (let y = 0; y < pattern.length; y ++) {
        for (let x = 0; x < pattern[y].length; x ++) {
            if (pattern[y][x] === true) {
                const iCol = Math.round(col + x - patternWidth / 2)
                const iRow = Math.round(row - y + patternHeight / 2)
                gameOfLife.setCellState(iCol, iRow, state)
            }
        }
    }
}
export const defaultPencilPattern: PencilPattern = [
    [true, true, true],
    [true, true, true],
    [true, true, true]
]
export const defaultPencil: Pencil = {
    label: 'Pencil',
    draggable: true,
    patterns: [
        {
            label: '1 px',
            pattern: [
                [true]
            ]
        },
        {
            label: '2 px',
            pattern: [
                [true, true],
                [true, true]
            ]
        },
        {
            label: '3 px',
            pattern: defaultPencilPattern
        },
        {
            label: '5 px',
            pattern: [
                [true, true, true, true, true],
                [true, true, true, true, true],
                [true, true, true, true, true],
                [true, true, true, true, true],
                [true, true, true, true, true]
            ]
        }
    ]
}
/**
 * List of available Pencils.
 */
export const pencils: Pencil[] = [
    defaultPencil,
    {
        label: 'Glider',
        draggable: false,
        patterns: [
            {
                label: '↘',
                pattern: [
                    [false, true, false],
                    [false, false, true],
                    [true, true, true]
                ]
            },
            {
                label: '↗',
                pattern: [
                    [true, true, true],
                    [false, false, true],
                    [false, true, false]
                ]
            },
            {
                label: '↙',
                pattern: [
                    [false, true, false],
                    [true, false, false],
                    [true, true, true]
                ]
            },
            {
                label: '↖',
                pattern: [
                    [true, true, true],
                    [true, false, false],
                    [false, true, false]
                ]
            },
        ]
    },{
        label: 'Spaceship',
        draggable: false,
        patterns: [
            {
                label: '→',
                pattern: [
                    [false, true, true, true, true],
                    [true, false, false, false, true],
                    [false, false, false, false, true],
                    [true, false, false, true, false]
                ]
            },
            {
                label: '⬅',
                pattern: [
                    [true, true, true, true, false],
                    [true, false, false, false, true],
                    [true, false, false, false, false],
                    [false, true, false, false, true]
                ]
            }
        ]
    },{
        label: 'Methuselahs',
        draggable: false,
        patterns: [
            {
                label: 'The R-pentomino',
                pattern: [
                    [false, true, true],
                    [true, true, false],
                    [false, true, false]
                ]
            },
            {
                label: 'Diehard',
                pattern: [
                    [false, false, false, false, false, false, true, false],
                    [true, true, false, false, false, false, false, false],
                    [false, true, false, false, false, true, true, true]
                ]
            },
            {
                label: 'Acorn',
                pattern: [
                    [false, true, false, false, false, false, false],
                    [false, false, false, true, false, false, false],
                    [true, true, false, false, true, true, true]
                ]
            }
        ]
    },{
        label: 'Eater',
        draggable: false,
        patterns: [
            {
                label: '↖',
                pattern: [
                    [true, true, false, false],
                    [true, false, true, false],
                    [false, false, true, false],
                    [false, false, true, true]
                ]
            },
        ]
    },{
        label: 'Generators',
        draggable: false,
        patterns: [
            {
                label: 'Gosper glider gun ↘',
                pattern: [
                    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
                    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, true, false, false, false, false, false, false, false, false, false, false, false],
                    [false, false, false, false, false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false, false, false, false, true, true],
                    [false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, true, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false, false, false, false, true, true],
                    [true, true, false, false, false, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
                    [true, true, false, false, false, false, false, false, false, false, true, false, false, false, true, false, true, true, false, false, false, false, true, false, true, false, false, false, false, false, false, false, false, false, false, false],
                    [false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
                    [false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
                    [false, false, false, false, false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
                ]
            }
        ]
    }
]
