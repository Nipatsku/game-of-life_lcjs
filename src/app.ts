// File binds parts into a functioning single-page web application:
// - Conways Game of Life
// - Rendering using LightningChart JS
// - User interactions

import { GameOfLife } from './gameOfLife'
import { GameOfLifeRenderer } from './renderer'
import { PencilPattern, pencils, defaultPencilPattern, Pencil, defaultPencil, applyPencilPattern, isPencilPatternInsideBounds, getPencilLocation } from './pencils'
import {
    DefaultLibraryStyle,
    UIElementBuilders,
    UIOrigins,
    UILayoutBuilders,
    UICheckBox,
    UIDraggingModes,
    UIButtonPictures,
    UIElementLine,
    UIBackgrounds
} from "@arction/lcjs"

const CELL_SIZE_PX = 8
const UI_FONT_SIZE = 14


// ----- Initialize GameOfLife logic and GameOfLife renderer -----
let gameOfLife: GameOfLife
const handleResizeEvent = (colCount: number, rowCount: number) => {
    // First time this is called, initialize GameOfLife logic object.
    if (! gameOfLife) {
        gameOfLife = new GameOfLife(colCount, rowCount)
    } else {
        gameOfLife.handleResize(colCount, rowCount)
    }
}
// Creating GameOfLifeRenderer immediately calls the passed resize event handler, which initialixes 'gameOfLife'.
const renderer = new GameOfLifeRenderer(CELL_SIZE_PX, handleResizeEvent)
const render = () => renderer.render(gameOfLife)


// ----- GameOfLife cycle loop -----
/**
 * To enable / disable automatic cycle loop, just set to true / false.
 */
let simulationActive = true
const _cycle = () => {
    if (simulationActive) {
        gameOfLife.cycle()
        render()
    }
    // Set timeout for next cycle.
    requestAnimationFrame(_cycle)
}
_cycle()



// ----- Create GUI with LightningChart JS UI system -----
const chart = renderer.chart



// (1) GameOfLife controller
// - Simulation enabled CheckBox
// - Clear cells Button

const ui_controller_layout = chart.addUIElement(UILayoutBuilders.Column)
    .setPosition({ x: 0, y: 100 })
    .setOrigin(UIOrigins.LeftTop)
    .setPadding({top: 2, left: 4})
    .setDraggingMode(UIDraggingModes.notDraggable)

const ui_controller_simulationEnabled = ui_controller_layout.addElement(UIElementBuilders.CheckBox)
    .setText('Simulation enabled')
    .setFont((font) => font
        .setSize(UI_FONT_SIZE)
    )
    .setOn(simulationActive)
ui_controller_simulationEnabled.onSwitch((_, state) => simulationActive = state)

const ui_controller_clearCells = ui_controller_layout.addElement(UIElementBuilders.ButtonBox)
    .setText('Clear')
    .setFont((font) => font
        .setSize(UI_FONT_SIZE)
    )
ui_controller_clearCells.onSwitch((_, state) => {
    if (state) {
        gameOfLife.clear()
        render()
    }
})



// (2) Pencil selector

const ui_pencilSelector_layout = chart.addUIElement(UILayoutBuilders.Row
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
/**
 * List of CheckBoxes representing each available PencilPattern.
 */
const ui_pencilSelector_selectors: UICheckBox[] = []
/**
 * Currently selected Pencil and pattern.
 */
let selectedPencil: {
    pencil: Pencil,
    pattern: PencilPattern
} = { pencil: defaultPencil, pattern: defaultPencilPattern }

const _selectPencil = (selector: UICheckBox, state: boolean | undefined, pattern: PencilPattern, pencil: Pencil) => {
    if (state) {
        selectedPencil = { pattern, pencil }

        // Disable other selectors ("Radio-button" behaviour).
        for (const selector2 of ui_pencilSelector_selectors)
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
                .setSize(UI_FONT_SIZE)
            )
        if (pattern === selectedPencil.pattern) {
            // Default selected Pencil.
            selector.setOn(true)
            selectedPencil = { pencil, pattern }
        }
        selector.onSwitch((selector, state) => _selectPencil(selector, state, pattern, pencil))
        ui_pencilSelector_selectors.push(selector)
    }
    const column = ui_pencilSelector_layout.addElement(UILayoutBuilders.Column)
    if ('pattern' in pencil.patterns[0]) {
        // Add Column layout for all variations of this pencil.
       const variation = pencil.patterns as { label: string, pattern: PencilPattern }[]
       column.addElement(UIElementBuilders.TextBox)
            .setText(pencil.label)
            .setFont((font) => font
                .setSize(UI_FONT_SIZE)
            )
       for (const pattern of variation) {
           addSelector(column, pattern.label, pattern.pattern)
       }
    } else {
        // Single pattern selector.
        addSelector(column, pencil.label, pencil.patterns as PencilPattern)
    }
    column.addGap()
}



// ----- Handle user interaction events -----
const userEventInterface = renderer.getUserEventInterface()

/**
 * Cached state that is saved when a dragging interaction is started.
 * 
 * If user starts dragging on a dead cell / empty space, the interaction will be to create alive cells.
 * Respectively, if the dragging is started on an alive cell, the cells will be replaced with empty spaces.
 */
let _drawMode = undefined
userEventInterface.onMouseDown((_, mouseEvent) => {
    const gameOfLifeLocation = renderer.translateUserEventLocation(mouseEvent)
    if (isPencilPatternInsideBounds(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF)) {
        applyPencilPattern(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF, _drawMode)
        render()
    }
})
userEventInterface.onMouseDragStart((_, mouseEvent) => {
    const gameOfLifeLocation = renderer.translateUserEventLocation(mouseEvent)
    if (isPencilPatternInsideBounds(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF)) {
        const pencilLocation = getPencilLocation(gameOfLifeLocation.colF, gameOfLifeLocation.rowF)
        _drawMode = gameOfLife.getCellState(pencilLocation.col, pencilLocation.row) === true ?
            undefined : true
    }
})
userEventInterface.onMouseDrag((_, mouseEvent) => {
    if (selectedPencil.pencil.draggable) {
        const gameOfLifeLocation = renderer.translateUserEventLocation(mouseEvent)
        if (isPencilPatternInsideBounds(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF)) {
            applyPencilPattern(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF, _drawMode)
            render()
        }
    }
})
userEventInterface.onTouchStart((_, touchEvents) => {
    for (let i = 0; i < touchEvents.changedTouches.length; i ++) {
        const touchEvent = touchEvents.changedTouches[i]
        const gameOfLifeLocation = renderer.translateUserEventLocation(touchEvent)
        if (isPencilPatternInsideBounds(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF)) {
            const pencilLocation = getPencilLocation(gameOfLifeLocation.colF, gameOfLifeLocation.rowF)
            _drawMode = gameOfLife.getCellState(pencilLocation.col, pencilLocation.row) === true ?
                undefined : true
    
            applyPencilPattern(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF, _drawMode)
            render()
        }
    }
})
userEventInterface.onTouchMove((_, touchEvents) => {
    if (selectedPencil.pencil.draggable) {
        for (let i = 0; i < touchEvents.changedTouches.length; i ++) {
            const touchEvent = touchEvents.changedTouches[i]
            const gameOfLifeLocation = renderer.translateUserEventLocation(touchEvent)
            if (isPencilPatternInsideBounds(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF)) {
                applyPencilPattern(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF, _drawMode)
                render()
            }
        }
    }
})
