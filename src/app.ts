// File binds parts into a functioning single-page web application:
// - Conways Game of Life
// - Rendering using LightningChart JS
// - User interactions

import { GameOfLife } from './gameOfLife'
import { GameOfLifeRenderer } from './renderer'
import { PencilPattern, pencils, defaultPencilPattern, Pencil, defaultPencil, applyPencilPattern, isPencilPatternInsideBounds, getPencilLocation, rotatePattern } from './pencils'
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
import { angDeg } from './utils';

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


// ----- GameOfLife cycle loop -----
// TODO: Currently actual rendering is one frame behind the user interactions.
// This happens because LCJS updates its rendering information in its own requestAnimationFrame callback.
/**
 * To enable / disable automatic cycle loop, just set to true / false.
 */
let simulationActive = true
const _cycle = () => {
    if (simulationActive) {
        gameOfLife.cycle()
        renderer.render(gameOfLife)
    }
    // Set timeout for next cycle.
    requestAnimationFrame(_cycle)
}
_cycle()

let _animFrameToken: number | undefined
const refresh = () => {
    if (simulationActive)
        return
    if (_animFrameToken === undefined)
        _animFrameToken = window.requestAnimationFrame(() => {
            _animFrameToken = undefined
            renderer.render(gameOfLife)
        })
}



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
        refresh()
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



// (3) Config options for GameOfLife.

const ui_config_layout = chart.addUIElement(UILayoutBuilders.Column)
    .setPosition({ x: 100, y: 100 })
    .setOrigin(UIOrigins.RightTop)
    .setPadding({top: 2, right: 4})
    .setDraggingMode(UIDraggingModes.notDraggable)

const ui_config_renderDeadCells = ui_config_layout.addElement(UIElementBuilders.CheckBox)
    .setText('Render dead cells')
    .setFont((font) => font
        .setSize(UI_FONT_SIZE)
    )
    // TODO: Read config from localStorage.
    .setOn(renderer.renderDeadCells)
ui_config_renderDeadCells.onSwitch((_, state) => {
    renderer.renderDeadCells = state
    refresh()
})


// ----- Handle user interaction events -----
const userEventInterface = renderer.getUserEventInterface()

let _userInteractionInfo = new Map<number, any>()
const id_mouse = 0

userEventInterface.onMouseDragStart((_, mouseEvent) => {
    if (selectedPencil.pencil.draggable) {
        // For draggable pattern, draw pattern continuously, based on the cell state at the starting location.
        const gameOfLifeLocation = renderer.translateUserEventLocation(mouseEvent)
        if (isPencilPatternInsideBounds(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF)) {
            const pencilLocation = getPencilLocation(gameOfLifeLocation.colF, gameOfLifeLocation.rowF)
            const drawMode = gameOfLife.getCellState(pencilLocation.col, pencilLocation.row) === true ? undefined : true
            _userInteractionInfo.set(id_mouse, drawMode)
            applyPencilPattern(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF, drawMode)
            refresh()
        }
    } else {
        // ... TODO: Describe non-draggable
        _userInteractionInfo.set(id_mouse, {
            clientX: mouseEvent.clientX,
            clientY: mouseEvent.clientY
        })
    }
})
userEventInterface.onMouseDrag((_, mouseEvent) => {
    if (selectedPencil.pencil.draggable) {
        // For draggable pattern, draw pattern continuously, based on the cell state at the starting location.
        const gameOfLifeLocation = renderer.translateUserEventLocation(mouseEvent)
        if (isPencilPatternInsideBounds(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF)) {
            const drawMode = _userInteractionInfo.get(id_mouse) as boolean | undefined
            applyPencilPattern(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF, drawMode)
            refresh()
        }
    }
})
userEventInterface.onMouseDragStop((_, mouseEvent) => {
    if (selectedPencil.pencil.draggable === false) {
        // ... TODO: Describe non-draggable
        const startLocation = _userInteractionInfo.get(id_mouse) as {clientX: number, clientY: number}
        const gameOfLifeLocation = renderer.translateUserEventLocation(startLocation)
        // Compute angle and rotate pattern.
        const ang = angDeg(startLocation.clientX, mouseEvent.clientY, mouseEvent.clientX, startLocation.clientY)
        const rotateCount =  Math.round((360 - (ang - selectedPencil.pencil.angle)) / 90)
        const rotatedPattern = rotatePattern(selectedPencil.pattern, rotateCount )
        if (isPencilPatternInsideBounds(gameOfLife, rotatedPattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF)) {
            applyPencilPattern(gameOfLife, rotatedPattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF, true)
            refresh()
        }
    }
})
userEventInterface.onTouchStart((_, touchEvents) => {
    for (let i = 0; i < touchEvents.changedTouches.length; i ++) {
        const touchEvent = touchEvents.changedTouches[i]
        if (selectedPencil.pencil.draggable) {
            // For draggable pattern, draw pattern continuously, based on the cell state at the starting location.
            const gameOfLifeLocation = renderer.translateUserEventLocation(touchEvent)
            if (isPencilPatternInsideBounds(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF)) {
                const pencilLocation = getPencilLocation(gameOfLifeLocation.colF, gameOfLifeLocation.rowF)
                const drawMode = gameOfLife.getCellState(pencilLocation.col, pencilLocation.row) === true ? undefined : true
                _userInteractionInfo.set(touchEvent.identifier, drawMode)
                applyPencilPattern(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF, drawMode)
                refresh()
            }
        } else {
            // ... TODO: Describe non-draggable
            _userInteractionInfo.set(touchEvent.identifier, {
                clientX: touchEvent.clientX,
                clientY: touchEvent.clientY
            })
        }

        
    }
})
userEventInterface.onTouchMove((_, touchEvents) => {
    if (selectedPencil.pencil.draggable) {
        // For draggable pattern, draw pattern continuously, based on the cell state at the starting location.
        for (let i = 0; i < touchEvents.changedTouches.length; i ++) {
            const touchEvent = touchEvents.changedTouches[i]
            const gameOfLifeLocation = renderer.translateUserEventLocation(touchEvent)
            if (isPencilPatternInsideBounds(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF)) {
                const drawMode = _userInteractionInfo.get(touchEvent.identifier) as boolean | undefined
                applyPencilPattern(gameOfLife, selectedPencil.pattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF, drawMode)
                refresh()
            }
        }
    }
})
userEventInterface.onTouchEnd((_, touchEvents) => {
    if (selectedPencil.pencil.draggable === false) {
        // ... TODO: Describe non-draggable
        for (let i = 0; i < touchEvents.changedTouches.length; i ++) {
            const touchEvent = touchEvents.changedTouches[i]
            const startLocation = _userInteractionInfo.get(touchEvent.identifier) as {clientX: number, clientY: number}
            const gameOfLifeLocation = renderer.translateUserEventLocation(startLocation)
            // Compute angle and rotate pattern.
            const ang = angDeg(startLocation.clientX, touchEvent.clientY, touchEvent.clientX, startLocation.clientY)
            const rotateCount =  Math.round((360 - (ang - selectedPencil.pencil.angle)) / 90)
            const rotatedPattern = rotatePattern(selectedPencil.pattern, rotateCount )
            if (isPencilPatternInsideBounds(gameOfLife, rotatedPattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF)) {
                applyPencilPattern(gameOfLife, rotatedPattern, gameOfLifeLocation.colF, gameOfLifeLocation.rowF, true)
                refresh()
            }
        }
    }
})
