import {
    lightningChart,
    Axis,
    emptyTick,
    PointShape,
    AutoCursorModes,
    PointSeries,
    ChartXY,
    UIElementBuilders,
    UIOrigins,
    SolidFill,
    ColorRGBA,
    transparentFill,
    translatePoint,
    UILayoutBuilders,
    UICheckBox,
    UIDraggingModes,
    UIButtonPictures,
    UIElementColumn,
    UIElementLine,
    ColorHSV,
    IndividualPointFill,
    ColorHEX,
    DefaultLibraryStyle,
    UIBackgrounds
} from "@arction/lcjs"

const chart = lightningChart().ChartXY({

})
    .setTitle("Conway's Game of Life")
    .setAutoCursorMode(AutoCursorModes.disabled)
    .setChartBackgroundFillStyle(new SolidFill({ color: ColorHEX('#fff') }))

const axisX = chart.getDefaultAxisX()
const axisY = chart.getDefaultAxisY()
const axisTop = chart.addAxisX(true)
const axisRight = chart.addAxisY(true)
const hideAxis = (axis: Axis) => {
    axis
        .setTickStyle(emptyTick)
        .setScrollStrategy(undefined)
}
hideAxis(axisX)
hideAxis(axisY)
hideAxis(axisTop)
hideAxis(axisRight)

class GameOfLife {
    // ----- Rendering properties -----
    readonly points: PointSeries = this.chart.addPointSeries({
        pointShape: PointShape.Square
    })
        .setPointSize(this.px)
        .setMouseInteractions(false)
        .setPointFillStyle(new SolidFill({ color: ColorRGBA(100, 100, 100) }))

    // ----- Conway's Game of Life state information -----
    /**
     * Cells "alive" states are recorded in a 2-dimensional boolean array.
     */
    cellStates: boolean[][] = [[]]
    /**
     * Flip buffer for 'cellStates'. Used for efficiency in updating.
     */
    cellStatesFlipBuffer: boolean[][] = [[]]

    constructor(
        readonly chart: ChartXY,
        readonly px: number
    ) {}
    /**
     * Applies one cycle of Conway's Game of Life rules.
     */
    cycle() {
        const { cellStates, bounds } = this.getState()
        const colLen = cellStates.length
        for (let colIndex = 0; colIndex < colLen; colIndex ++) {
            const rowLen = cellStates[colIndex].length
            for (let rowIndex = 0; rowIndex < rowLen; rowIndex ++) {
                /**
                 * Previous cell state.
                 */
                const c = cellStates[colIndex][rowIndex]
                /**
                 * Sum of live cells in eight-location neighbourhood.
                 */
                let n = 0
                if (colIndex > bounds.x.min) {
                    // Check left neighbours.
                    if (rowIndex > bounds.y.min) {
                        // Check neighbour on bottom left.
                        n += cellStates[colIndex - 1][rowIndex - 1] ? 1 : 0
                    }
                    if (rowIndex < bounds.y.max) {
                        // Check neighbour on top left.
                        n += cellStates[colIndex - 1][rowIndex + 1] ? 1 : 0
                    }
                    // Check neighbour on direct left.
                    n += cellStates[colIndex - 1][rowIndex] ? 1 : 0
                }
                if (rowIndex > bounds.y.min) {
                    // Check neighbour directly below.
                    n += cellStates[colIndex][rowIndex - 1] ? 1 : 0
                }
                if (rowIndex < bounds.y.max) {
                    // Check neighbour directly above.
                    n += cellStates[colIndex][rowIndex + 1] ? 1 : 0
                }
                if (colIndex < bounds.x.max) {
                    // Check right neighbours.
                    if (rowIndex > bounds.y.min) {
                        // Check neighbour on bottom right.
                        n += cellStates[colIndex + 1][rowIndex - 1] ? 1 : 0
                    }
                    if (rowIndex < bounds.y.max) {
                        // Check neighbour on top right.
                        n += cellStates[colIndex + 1][rowIndex + 1] ? 1 : 0
                    }
                    // Check neighbour on direct right.
                    n += cellStates[colIndex + 1][rowIndex] ? 1 : 0
                }
                /**
                 * New cell state.
                 */
                let C = false
                if ((
                    (c) && (n === 2 || n === 3)
                ) || (
                    (! c) && (n === 3)
                )) {
                    C = true
                }
                this.cellStatesFlipBuffer[colIndex][rowIndex] = C
            }
        }
        // Flip cellStates.
        this.cellStates = this.cellStatesFlipBuffer
        this.cellStatesFlipBuffer = cellStates
    }
    plot() {
        const points = this.points
        points.clear()
        
        let pointsAmount = 0
        const px = this.px
        const px2 = this.px / 2
        const cellStates = this.cellStates
        const colLen = cellStates.length
        for (let colIndex = 0; colIndex < colLen; colIndex ++) {
            const rowLen = cellStates[colIndex].length
            for (let rowIndex = 0; rowIndex < rowLen; rowIndex ++) {
                const isCellAlive = cellStates[colIndex][rowIndex]
                if (isCellAlive) {
                    points.add({
                        x: px2 + colIndex * px,
                        y: px2 + rowIndex * px
                    })
                    pointsAmount ++
                }
            }
        }

        console.log(pointsAmount, 'points')
    }
    /**
     * Validates structure (Array length) of 'cellStates' and 'cellStatesFlipBuffer',
     * based on given pixel boundaries.
     */
    handleResize(widthPx: number, heightPx: number) {
        const prevWidth = this.cellStates.length
        const prevHeight = this.cellStates[0].length
        const newWidth = Math.floor(widthPx / this.px)
        const newHeight = Math.floor(heightPx / this.px)

        const widthIncreased = newWidth > prevWidth
        const heightIncreased = newHeight > prevHeight

        if (widthIncreased)
            for (let i = prevWidth; i < newWidth; i++) {
                this.cellStates.push([])
                this.cellStatesFlipBuffer.push([])
            }
        else {
            this.cellStates.length = newWidth
            this.cellStatesFlipBuffer.length = newWidth
        }

        for (let colIndex = 0; colIndex < newWidth; colIndex ++) {
            if (heightIncreased)
                for (let i = prevHeight; i < newHeight; i ++) {
                    this.cellStates[colIndex][i] = false
                    this.cellStatesFlipBuffer[colIndex][i] = false
                }
            else {
                this.cellStates[colIndex].length = newHeight
                this.cellStatesFlipBuffer[colIndex].length = newHeight
            }
        }
    }
    getState() {
        return {
            cellStates: this.cellStates,
            bounds: {
                x: {
                    min: 0,
                    max: this.cellStates.length - 1,
                    center: Math.round((this.cellStates.length - 1) / 2)
                },
                y: {
                    min: 0,
                    max: this.cellStates[0].length - 1,
                    center: Math.round((this.cellStates[0].length - 1) / 2)
                }
            }
        }
    }
    // ----- Some pure functions for handling cells in relevant ways -----
    // ----- Creating popular shapes, etc...                         -----
    /**
     * Pure function for cleaning a cellState array.
     */
    clear(cellStates: boolean[][]) {
        const colLen = cellStates.length
        for (let colIndex = 0; colIndex < colLen; colIndex ++) {
            const rowLen = cellStates[colIndex].length
            for (let rowIndex = 0; rowIndex < rowLen; rowIndex ++) {
                cellStates[colIndex][rowIndex] = false
            }
        }
    }
    initialState() {
        const { cellStates, bounds } = this.getState()
        // cellStates[bounds.x.min][bounds.y.min] = true
        // cellStates[bounds.x.min][bounds.y.max] = true
        // cellStates[bounds.x.max][bounds.y.min] = true
        // cellStates[bounds.x.max][bounds.y.max] = true
        
        // this.createShapeC(cellStates, bounds.x.center, bounds.y.center)

    }
    /**
     * Simple Shape that lives forever if left alone.
     * Serves as a simple test that the rules are working as should.
     */
    createShapeA(cellStates: boolean[][], x: number, y: number) {
        cellStates[x][y - 1] = true
        cellStates[x][y + 0] = true
        cellStates[x][y + 1] = true
    }
    /**
     *
     */
    createShapeB(cellStates: boolean[][], x: number, y: number) {
        this.createShapeA(cellStates, x, y)
        this.createShapeA(cellStates, x - 3, y)
        this.createShapeA(cellStates, x + 3, y)
    }
    createShapeC(cellStates: boolean[][], x: number, y: number) {
        this.createShapeA(cellStates, x, y)
        this.createShapeA(cellStates, x - 3, y)
        this.createShapeA(cellStates, x + 3, y)
        this.createShapeA(cellStates, x + 6, y)
        this.createShapeA(cellStates, x - 6, y)
        this.createShapeA(cellStates, x, y + 6)
        this.createShapeA(cellStates, x - 3, y + 6)
        this.createShapeA(cellStates, x + 3, y + 6)
        this.createShapeA(cellStates, x + 6, y + 6)
        this.createShapeA(cellStates, x - 6, y + 6)
    }
}

const gameOfLife = new GameOfLife(
    chart,
    // Pixel size.
    6
)
const plot = () => {
    gameOfLife.plot()
}
const rectSeries = chart.addRectangleSeries()
const rect = rectSeries.add({x1: 0, y1: 0, x2: 0, y2: 0})
    .setFillStyle(transparentFill)
    .setFillStyleHighlight(transparentFill)
const handleResize = () => {
    const width = axisX.scale.getCellSize()
    const height = axisY.scale.getCellSize()
    // Bind Axis intervals to Chart size as pixels.
    axisX.setInterval(0, width)
    axisY.setInterval(0, height)
    // Inform game of life.
    gameOfLife.handleResize(width, height)
    // Update mouse picking rectangle.
    rect.setDimensions({
        x1: 0,
        y1: 0,
        x2: width,
        y2: height
    })
    // re-plot
    plot()
}
chart.onResize(handleResize)
handleResize()
gameOfLife.initialState()
gameOfLife.plot()

let simulationActive = true
const cycle = () => {
    gameOfLife.cycle()
    plot()
    if (simulationActive)
        requestAnimationFrame(cycle)
}
const col = chart.addUIElement(UILayoutBuilders.Column)
    .setPosition({ x: 0, y: 100 })
    .setOrigin(UIOrigins.LeftTop)
    .setPadding({top: 2, left: 4})
    .setDraggingMode(UIDraggingModes.notDraggable)
const fontSize = 14
const toggleSimulationButton = col.addElement(UIElementBuilders.CheckBox)
    .setText('Simulation enabled')
    .setFont((font) => font
        .setSize(fontSize)
    )
toggleSimulationButton.onSwitch((_, state) => {
        simulationActive = state
        if (simulationActive)
            cycle()
    })
if (simulationActive)
    toggleSimulationButton.setOn(true)
col.addElement(UIElementBuilders.ButtonBox)
    .setText('Clear')
    .setFont((font) => font
        .setSize(fontSize)
    )
    .onSwitch((_, state) => {
        if (state) {
            gameOfLife.clear(gameOfLife.cellStates)
            plot()
        }
    })
const pencilSelector = chart.addUIElement(UILayoutBuilders.Row
    .setBackground((UIBackgrounds.Rectangle))
)
    .setPosition({ x: 0, y: 0})
    .setOrigin(UIOrigins.LeftBottom)
    .setMargin({bottom: 2, left: 4})
    .setPadding({ left: 4, right: 4 })
    .setDraggingMode(UIDraggingModes.draggable)
    .setBackground((background) => background
        .setFillStyle((DefaultLibraryStyle.panelBackgroundFillStyle
            .setA(100)    
        ))
    )
    
// TODO: Load
interface Pencil {
    label: string,
    draggable: boolean,
    patterns: boolean[][] | { label: string, pattern: boolean[][] }[]
}
const pencils: Pencil[] = [
    {
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
                pattern: [
                    [true, true, true],
                    [true, true, true],
                    [true, true, true]
                ]
            }
        ]
    },{
        label: 'Glider',
        draggable: false,
        patterns: [
            {
                label: '↗',
                pattern: [
                    [false, true, false],
                    [false, false, true],
                    [true, true, true]
                ]
            },
            {
                label: '↘',
                pattern: [
                    [true, true, true],
                    [false, false, true],
                    [false, true, false]
                ]
            },
            {
                label: '↖',
                pattern: [
                    [false, true, false],
                    [true, false, false],
                    [true, true, true]
                ]
            },
            {
                label: '↙',
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
        label: 'Generators',
        draggable: false,
        patterns: [
            {
                label: 'Gosper glider gun',
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
const patternSelectors: UICheckBox[] = []
let selectedPattern: boolean[][] = pencils[0].patterns as boolean[][]
let draggingEnabled: boolean
const selectPattern = (selector, state, pattern: boolean[][], pencil: Pencil) => {
    if (state) {
        selectedPattern = pattern
        draggingEnabled = pencil.draggable
        // Disable other selectors.
        for (const selector2 of patternSelectors)
            if (selector2 !== selector) {
                selector2.setOn(false)
            }
    }
}
for (const pencil of pencils) {
    const buttonPicture = pencil.draggable ?
        UIButtonPictures.Circle : UIButtonPictures.Rectangle
    const addSelector = (layout: UIElementLine, label: string, pattern: boolean[][]) => {
        const selector = layout.addElement(UIElementBuilders.CheckBox
            .setPictureOn(buttonPicture)
            .setPictureOff(buttonPicture)
        )
            .setText(label)
            .setFont((font) => font
                .setSize(fontSize)
            )
        if (patternSelectors.length === 0) {
            selector.setOn(true)
            selectedPattern = pattern
            draggingEnabled = pencil.draggable
        }
        selector.onSwitch((selector, state) => selectPattern(selector, state, pattern, pencil))
        patternSelectors.push(selector)
    }
    const column = pencilSelector.addElement(UILayoutBuilders.Column)
    if ('pattern' in pencil.patterns[0]) {
        // Add Column layout for all variations of this pencil.
       const variation = pencil.patterns as { label: string, pattern: boolean[][] }[]
       column.addElement(UIElementBuilders.TextBox)
            .setText(pencil.label)
            .setFont((font) => font
                .setSize(fontSize)
            )
       for (const pattern of variation) {
           addSelector(column, pattern.label, pattern.pattern)
       }
    } else {
        // Single pattern selector.
        addSelector(column, pencil.label, pencil.patterns as boolean[][])
    }
    column.addGap()
}

const getCellState = (clientX: number, clientY: number) => {
    const location = translatePoint(
        chart.engine.clientLocation2Engine(clientX, clientY),
        chart.engine.scale,
        {
            x: axisX.scale,
            y: axisY.scale
        }
    )
    const col = Math.round(location.x / gameOfLife.px)
    const row = Math.round(location.y / gameOfLife.px)
    return gameOfLife.cellStates[col][row]
}
const toggleCell = (clientX: number, clientY: number, state?: boolean) => {
    const location = translatePoint(
        chart.engine.clientLocation2Engine(clientX, clientY),
        chart.engine.scale,
        {
            x: axisX.scale,
            y: axisY.scale
        }
    )
    const locationCol = location.x / gameOfLife.px
    const locationRow = location.y / gameOfLife.px

    const pattern = selectedPattern
    const pHeight = pattern.length
    const pWidth = pattern.reduce((prev, cur) => Math.max(prev, cur.length), 0)

    for (let y = 0; y < pattern.length; y ++) {
        for (let x = 0; x < pattern[y].length; x ++) {
            if (pattern[y][x] === true) {
                const col = Math.round(locationCol + x - pWidth / 2)
                const row = Math.round(locationRow - y + pHeight / 2)
                gameOfLife.cellStates[col][row] = (state === undefined) ?
                    (gameOfLife.cellStates[col][row] === true ? false : true):
                    state
            }
        }
    }
    plot()    
}
let drawMode = undefined
rect.onMouseDown((_, e) => toggleCell(e.clientX, e.clientY))
rect.onMouseDragStart((_, e) => {
    drawMode = ! getCellState(e.clientX, e.clientY)
})
rect.onMouseDrag((_, e) => draggingEnabled ? toggleCell(e.clientX, e.clientY, drawMode) : undefined)
rect.onTouchStart((_, e) => {
    drawMode = ! getCellState(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
    toggleCell(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
})
rect.onTouchMove((_, e) => draggingEnabled ? toggleCell(e.changedTouches[0].clientX, e.changedTouches[0].clientY, drawMode) : undefined)
