
declare var firebase: any;

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
    readonly outOfBoundsSeries = this.chart.addRectangleSeries()
        .setDefaultStyle((rect) => rect
            .setFillStyle(new SolidFill({ color: ColorRGBA(255, 200, 200) }))
        )
    readonly outOfBoundsRight = this.outOfBoundsSeries.add({x1: 0, y1: 0, x2: 0, y2: 0})
    readonly outOfBoundsTop = this.outOfBoundsSeries.add({x1: 0, y1: 0, x2: 0, y2: 0})

    readonly points: PointSeries = this.chart.addPointSeries({
        pointShape: PointShape.Square
    })
        .setPointSize(this.px)
        .setMouseInteractions(false)
        .setPointFillStyle(new SolidFill({ color: ColorRGBA(100, 100, 100) }))

        
    readonly deadPoints: PointSeries = this.chart.addPointSeries({
        pointShape: PointShape.Square
    })
        .setPointSize(this.px)
        .setMouseInteractions(false)
        .setPointFillStyle(new SolidFill({ color: ColorRGBA(200, 255, 200) }))

    // ----- Conway's Game of Life state information -----
    /**
     * Cells "alive" states are recorded in a 2-dimensional boolean array.
     * 
     * 'undefined' = no cell ever existed.
     * 'false' = a previous alive cell, now dead.
     */
    cellStates: (boolean | undefined)[][] = [[]]
    /**
     * Flip buffer for 'cellStates'. Used for efficiency in updating.
     */
    cellStatesFlipBuffer: (boolean | undefined)[][] = [[]]

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
                let C = (c !== undefined) ? false : undefined
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
        const deadPoints = this.deadPoints
        
        points.clear()
        deadPoints.clear()

        const px = this.px
        const px2 = this.px / 2
        const cellStates = this.cellStates
        const colLen = cellStates.length
        for (let colIndex = 0; colIndex < colLen; colIndex ++) {
            const rowLen = cellStates[colIndex].length
            for (let rowIndex = 0; rowIndex < rowLen; rowIndex ++) {
                const cellState = cellStates[colIndex][rowIndex]
                if (cellState === true) {
                    points.add({
                        x: px2 + colIndex * px,
                        y: px2 + rowIndex * px
                    })
                } else if (cellState === false) {
                    deadPoints.add({
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
                    this.cellStates[colIndex][i] = undefined
                    this.cellStatesFlipBuffer[colIndex][i] = undefined
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
                cellStates[colIndex][rowIndex] = undefined
            }
        }
    }
    initialState() {
        const { cellStates, bounds } = this.getState()
    }


    // ----- MP utils -----
    encodeState() {
        return this.cellStates.map((arr) =>
            arr.map((item) => String(item))
        )
    }
    decodeState(state: string[][]) {
        const cellStates = state.map((arr) =>
            arr.map((item) => 
                item === 'undefined' ?
                    undefined : (
                        item === 'false' ?
                            false : true
                    )
            )
        )
        this.cellStates = cellStates

        // Use handleResize to initialize Array.
        const width = this.cellStates.length
        const height = this.cellStates[0].length
        this.handleResize(width * this.px, height * this.px)

        // Render out of bounds area.
        const dimensionsRight = {
            x1: width * this.px,
            y1: 0,
            x2: axisX.scale.getInnerEnd(),
            y2: axisY.scale.getInnerEnd()
        }
        this.outOfBoundsRight.setDimensions(dimensionsRight)
        const dimensionsTop = {
            x1: 0,
            y1: (height + 1) * this.px,
            x2: width * this.px,
            y2: axisY.scale.getInnerEnd()
        }
        this.outOfBoundsTop.setDimensions(dimensionsTop)
    }

}

const gameOfLife = new GameOfLife(
    chart,
    // Pixel size.
    8
)
const plot = () => {
    gameOfLife.plot()
    console.log('currently rendered cycle: ',cycle)
}
const rectSeries = chart.addRectangleSeries()
const rect = rectSeries.add({x1: 0, y1: 0, x2: 0, y2: 0})
    .setFillStyle(transparentFill)
    .setFillStyleHighlight(transparentFill)
const handleResize = () => {
    if (database) {
        // Resizing breaks synchronization between server and clients.
        // Throw an error !
        throw new Error('Resizing is not allowed in multiplayer mode !')
    }

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

let simulationActive = false
let cycle = 0
const nextCycle = () => {
    if (sync)
        sync()
    gameOfLife.cycle()
    plot()
    if (simulationActive)
        setTimeout(nextCycle, 1000)
        // requestAnimationFrame(nextCycle)
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
            nextCycle()
    })
if (simulationActive)
    toggleSimulationButton.setOn(true)
const clearButton = col.addElement(UIElementBuilders.ButtonBox)
    .setText('Clear')
    .setFont((font) => font
        .setSize(fontSize)
    )
clearButton.onSwitch((_, state) => {
        if (state) {
            gameOfLife.clear(gameOfLife.cellStates)
            plot()

            if (database) {
                // Sync clear with DB. We must be host.
                if (database) {
                    const key = database.ref().child('session-interactions').push().key
                    const uuid = Uuid()
                    const interactionData = {
                        type: 'clear',
                        uuid
                    }
                    const updates = {}
                    updates['/session-interactions/' + key] = interactionData
                    database.ref().update(updates)
                }
            }
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
    },{
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
    const locationCol = Math.round(location.x / gameOfLife.px)
    const locationRow = Math.round(location.y / gameOfLife.px)
    // Check if location is within game of life boundaries.
    const {bounds} = gameOfLife.getState()
    if (locationCol < bounds.x.min || locationCol > bounds.x.max || locationRow < bounds.y.min || locationRow > bounds.y.max) {
        return
    }
    return gameOfLife.cellStates[locationCol][locationRow]
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
    const {bounds} = gameOfLife.getState()

    // Check if location is within game of life boundaries.
    if (
        Math.round(locationCol - pWidth * .5)  < bounds.x.min ||
        Math.round(locationCol + pWidth * .5)  > bounds.x.max ||
        Math.round(locationRow - pHeight * .5)  < bounds.y.min ||
        Math.round(locationRow + pHeight * .5)  > bounds.y.max
    ) {
        return
    }

    const uuid = Uuid()
    const interactionData = {
        type: 'draw',
        uuid,
        cycle,
        locationCol,
        locationRow,
        pattern,
        state: String(state)
    }

    handleInteraction(interactionData)

    // Sync interaction with DB.
    if (database) {
        const key = database.ref().child('session-interactions').push().key

        const updates = {}
        updates['/session-interactions/' + key] = interactionData
        database.ref().update(updates)
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
    for (let i = 0; i < e.changedTouches.length; i ++) {
        drawMode = ! getCellState(e.changedTouches[i].clientX, e.changedTouches[i].clientY)
        toggleCell(e.changedTouches[i].clientX, e.changedTouches[i].clientY)
    }
})
rect.onTouchMove((_, e) => {
    for (let i = 0; i < e.changedTouches.length; i ++) {
        draggingEnabled ? toggleCell(e.changedTouches[i].clientX, e.changedTouches[i].clientY, drawMode) : undefined
    }
})

const mpToolbox = chart.addUIElement(UILayoutBuilders.Column)
    .setPosition({x: 100, y: 100})
    .setOrigin(UIOrigins.RightTop)

let sync
let database
const Uuid = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
const handledInteractions = []
const unhandledInteractions = []
const subscribeToInteractions = () => {
    database.ref('session-interactions').on("value", (snapshot) => {
        const value = snapshot.val()
        if (value === null)
            return

        // Check for unhandled interactions.
        const unhandledInteractions = []
        const lenHandledInteractions = handledInteractions.length
        for (const key in value) {
            const interaction = value[key]
            let wasHandledAlready = false
            for (let iHandledInteraction = 0; iHandledInteraction < lenHandledInteractions; iHandledInteraction ++) {
                const handledInteraction = handledInteractions[iHandledInteraction]
                if (handledInteraction.uuid === interaction.uuid) {
                    wasHandledAlready = true
                    break
                }
            }
            if (! wasHandledAlready) {
                // Interaction must be handled - Add to list.
                unhandledInteractions.push(interaction)
            }
        }
        
        checkUnhandledInteractions(unhandledInteractions)
    })
}
let savedStates
const checkUnhandledInteractions = (interactionsList: Array<any>) => {
    if (interactionsList.length === 0)
        return    
    // Sort unhandled interactions list on 'cycle' ascending order.
    const interactions = interactionsList.sort((a, b) => a.cycle - b.cycle)

    if (interactions[0].cycle < cycle) {
        // Back-tracking will be necessary ...
        if (! savedStates)
            throw new Error('Back-tracking necessary, but previous states are not saved !')
        
        const backtrackTo = (iCycle) => {
            // Find saved state.
            const savedState = savedStates.find((state) => state.cycle === iCycle)
            if (savedState === undefined)
                throw new Error('Back-tracking necessary, but there is no saved state for cycle:'+iCycle)
            
            gameOfLife.decodeState(savedState.state)
        }

        // Combine unhandled and handled interactions into one list.
        let allInteractions = handledInteractions.concat(interactions)
        // Sort again.
        allInteractions = allInteractions.sort((a, b) => a.cycle - b.cycle)

        // Back-track to oldest unhandled interactions cycle.
        let backTrackedCycle = interactions[0].cycle
        backtrackTo(backTrackedCycle)

        // Iterate over cycles leading to current one.
        for (let iCycle = backTrackedCycle; iCycle < cycle; iCycle ++) {
            // Handle interactions of cycle i.
            // TODO: Desynchronization can occur, if interaction order is relevant.
            for (const interaction of allInteractions) {
                if (interaction.cycle === iCycle) {
                    handleInteraction(interaction)
                }
            }

            // Increment cycle.
            gameOfLife.cycle()
        }
        // Handle interactions of current cycle.
        for (const interaction of allInteractions) {
            if (interaction.cycle === cycle)
                handleInteraction(interaction)
        }

    } else {
        // All unhandled interactions should be of the current cycle.
        // They can be handled as is.
        for (const interaction of interactionsList)
            handleInteraction(interaction)
    }
    plot()
}
const handleInteraction = (interaction) => {
    const { uuid, type } = interaction
    if (type === 'draw') {
        let { pattern, locationCol, locationRow, state } = interaction
        state = state === 'undefined' ? undefined : (state === 'true'? true : false)
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
    } else if (type === 'clear') {
        gameOfLife.clear(gameOfLife.cellStates)
        plot()
    }

    // Mark as handled (check for duplicates first).
    if (handledInteractions.find((item) => item.uuid === uuid) === undefined)
        handledInteractions.push(interaction)  
}
const host = () => {
    database = firebase.database()
    cycle = -1
    const initialState = gameOfLife.encodeState()
    const interactions = []

    database.ref('session-initialState').set(initialState)
    database.ref('session-simulationEnabled').set(simulationActive)
    database.ref('session-cycle').set(cycle)
    database.ref('session-interactions').set(interactions)

    // Host saves n previous states, in case it needs to back-track to previous states.
    // This can be necessary, if a client is too slow to report of its interactions in time.
    savedStates = []

    sync = () => {
        // Cache state for enabling back-tracking.
        if (savedStates.length >= 8)
            savedStates.shift()
        savedStates.push({
            cycle,
            // Note that the saved state also doesn't contain any interactions
            // triggered by host !
            state: gameOfLife.encodeState()
        })

        cycle++
        database.ref('session-cycle').set(cycle)
    }
    sync()

    subscribeToInteractions()

    // Disable connection selectors.
    mpToolbox.dispose()
    chart.addUIElement(UIElementBuilders.TextBox)
        .setPosition({x: 100, y: 100})
        .setOrigin(UIOrigins.RightTop)
        .setText('Hosting session')
}
const connect = () => {
    database = firebase.database()

    // Disable local ablitiy to toggle simulation.
    simulationActive = false
    toggleSimulationButton.dispose()

    database.ref('session-initialState').once("value", (snapshot) => {
        const value = snapshot.val()
        gameOfLife.decodeState(value)
        // handleResize()
        plot()
    })

    let initialValue = true
    database.ref('session-cycle').on("value", (snapshot) => {
        const value = snapshot.val()
        if (initialValue) {
            cycle = value
            initialValue = false
        } else {
            // Sync with cycle on database.
            for (cycle = cycle; cycle < value; cycle ++) {
                // Handle unhandled interactions of this cycle only.
                for (const unhandledInteraction of unhandledInteractions) {
                    if (cycle === unhandledInteraction.cycle)
                        handleInteraction(unhandledInteraction)
                }
                
                gameOfLife.cycle()
            }
        }
        plot()
    })

    subscribeToInteractions()

    // Disable connection selectors.
    mpToolbox.dispose()
    mpToolbox.dispose()
    chart.addUIElement(UIElementBuilders.TextBox)
        .setPosition({x: 100, y: 100})
        .setOrigin(UIOrigins.RightTop)
        .setText('Connected to remote session')

    clearButton.dispose()
}
mpToolbox.addElement(UIElementBuilders.ButtonBox)
    .setText('Host')
    .onSwitch((_, state) => {
        if (state)
            host()
    })

mpToolbox.addElement(UIElementBuilders.ButtonBox)
    .setText('Connect')
    .onSwitch((_, state) => {
        if (state)
            connect()
    })
