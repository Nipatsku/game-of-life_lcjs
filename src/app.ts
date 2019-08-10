import {
    lightningChart,
    SolidLine,
    emptyLine,
    SolidFill,
    emptyFill,
    ColorHSV,
    Axis,
    emptyTick,
    AxisScrollStrategies,
    PointShape,
    AutoCursorModes,
    PointSeries,
    ChartXY
} from "@arction/lcjs"

const chart = lightningChart().ChartXY({

})
    .setTitle("Conway's Game of Life")
    .setAutoCursorMode(AutoCursorModes.disabled)

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
    initialState() {
        const { cellStates, bounds } = this.getState()
        cellStates[bounds.x.min][bounds.y.min] = true
        cellStates[bounds.x.min][bounds.y.max] = true
        cellStates[bounds.x.max][bounds.y.min] = true
        cellStates[bounds.x.max][bounds.y.max] = true
        
        this.createShapeA(cellStates, bounds.x.center, bounds.y.center)
    }
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
                }
            }
        }
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
    /**
     * Simple Shape that lives forever if left alone.
     * Serves as a simple test that the rules are working as should.
     */
    createShapeA(cellStates: boolean[][], x: number, y: number) {
        cellStates[x][y - 1] = true
        cellStates[x][y + 0] = true
        cellStates[x][y + 1] = true
    }
}

const gameOfLife = new GameOfLife(
    chart,
    // Pixel size.
    10
)
const plot = () => {
    gameOfLife.plot()
}
const handleResize = () => {
    const width = axisX.scale.getCellSize()
    const height = axisY.scale.getCellSize()
    // Bind Axis intervals to Chart size as pixels.
    axisX.setInterval(0, width)
    axisY.setInterval(0, height)
    // Inform game of life.
    gameOfLife.handleResize(width, height)
    // re-plot
    plot()
}
chart.onResize(handleResize)
handleResize()
gameOfLife.initialState()
gameOfLife.plot()
const cycle = () => {
    gameOfLife.cycle()
    plot()
    window.requestAnimationFrame(cycle)
}
window.requestAnimationFrame(cycle)