// File contains rendering logic for Conways Game of Life using LightningChart JS

import { GameOfLife } from './gameOfLife'
import {
    lightningChart,
    Axis,
    AutoCursorModes,
    PointSeries,
    PointShape,
    Interactable,
    ColorHEX,
    ColorRGBA,
    SolidFill,
    transparentFill,
    emptyTick,
    translatePoint
} from "@arction/lcjs"

/**
 * Isolated rendering logic in the form of a Class.
 */
export class GameOfLifeRenderer {

    readonly chart = lightningChart().ChartXY()
        .setTitle("Conway's Game of Life")
        .setAutoCursorMode(AutoCursorModes.disabled)
        .setChartBackgroundFillStyle(new SolidFill({ color: ColorHEX('#fff') }))

    // ----- Axes' of Chart are unused in application, and almost completely hidden -----
    readonly axisX      = hideAxis(this.chart.getDefaultAxisX())
    readonly axisY      = hideAxis(this.chart.getDefaultAxisY())
    readonly axisTop    = hideAxis(this.chart.addAxisX(true))
    readonly axisRight  = hideAxis(this.chart.addAxisY(true))

    // ----- In order to subscribe to user interaction events, a transparent Rectangle is layed over the whole Chart -----
    readonly rectSeries = this.chart.addRectangleSeries()
    readonly rect = this.rectSeries.add({x1: 0, y1: 0, x2: 0, y2: 0})
        .setFillStyle(transparentFill)
        .setFillStyleHighlight(transparentFill)

    // ----- Series used for rendering Game of Life -----
    readonly deadPoints: PointSeries = this.chart.addPointSeries({
        pointShape: PointShape.Square
    })
        .setPointSize(this.cellSizePx)
        .setMouseInteractions(false)
        .setPointFillStyle(new SolidFill({ color: ColorRGBA(200, 255, 200) }))
        
    readonly points: PointSeries = this.chart.addPointSeries({
        pointShape: PointShape.Square
    })
        .setPointSize(this.cellSizePx)
        .setMouseInteractions(false)
        .setPointFillStyle(new SolidFill({ color: ColorRGBA(100, 100, 100) }))

    /**
     * Cached state for handling user interactions.
     */
    renderedState: {
        colCount: number,
        rowCount: number
    }

    /**
     * @param cellSizePx            Size of a cell in pixels
     * @param resizeEventHandler    Function that is called when viewport is resized. This is called immediately.
     */
    constructor(
        readonly cellSizePx: number,
        readonly resizeEventHandler: (colCount: number, rowCount: number) => void
    ) {
        // Handle initial size configuration immediately.
        this.handleResize()
        
        // Subscribe to Charts resize event, for handling it.
        this.chart.onResize(this.handleResize)
    }

    render(gameOfLife: GameOfLife) {
        const cellStates = gameOfLife.getCellStates()
        const points = this.points
        const deadPoints = this.deadPoints
        
        points.clear()
        deadPoints.clear()

        const px = this.cellSizePx
        const px2 = this.cellSizePx / 2
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

        // Cache information about rendered state for handling user interactions.
        this.renderedState = {
            colCount: gameOfLife.getColumnCount(),
            rowCount: gameOfLife.getRowCount()
        }
    }

    // ----- Interface for user interactions -----
    /**
     * Method exposes an interface for subscribing to different user-events on the rendering surface.
     * - Mouse events
     * - Touch events
     */
    getUserEventInterface(): Interactable {
        return this.rect
    }
    /**
     * Translates an user events location to Game of Life columns and rows.
     *
     * @param event JS Event object or something with similar structure
     * @return      Column and row as doubles
     */
    translateUserEventLocation(event: { clientX: number, clientY: number }): ({ colF: number, rowF: number }) {
        // Use Chart API to translate JS Event location to the Charts rendering Engine.
        const locationOnChart = this.chart.engine.clientLocation2Engine(event.clientX, event.clientY)
        
        // Use LightningChart utility function to translate the location to the Axes of Series.
        const locationOnAxes = translatePoint(
            locationOnChart,
            // Origin scale
            this.chart.engine.scale,
            // Target scale
            {
                x: this.axisX.scale,
                y: this.axisY.scale
            }
        )
        const colF = locationOnAxes.x / this.cellSizePx
        const rowF = locationOnAxes.y / this.cellSizePx
        return {
            colF,
            rowF
        }
    }

    // ----- Internal logic -----
    /**
     * Function handles event when the size of viewport is changed.
     *
     * **Must be a function property, as opposed to a method, as this is used as an event handler!**
     */
    private handleResize = () => {
        const widthPx = this.axisX.scale.getCellSize()
        const heightPx = this.axisY.scale.getCellSize()
        // Ensure that Axis interval is in pixel units.
        this.axisX.setInterval(0, widthPx)
        this.axisY.setInterval(0, heightPx)

        // Update mouse picking Rectangle bounds.
        this.rect.setDimensions({
            x1: 0,
            y1: 0,
            x2: widthPx,
            y2: heightPx
        })

        // Compute new amount of columns and rows.
        const colCount = Math.floor(widthPx / this.cellSizePx)
        const rowCount = Math.floor(heightPx / this.cellSizePx)
        // Call external event handler.
        this.resizeEventHandler(colCount, rowCount)
    }

}

const hideAxis = (axis: Axis) => 
    axis
        .setTickStyle(emptyTick)
        .setScrollStrategy(undefined)
