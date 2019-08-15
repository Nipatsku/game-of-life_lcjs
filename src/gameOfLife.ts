// File contains pure logic of Conways Game of Life.
// No rendering or user interaction logic.

/**
 * Cell states are recorded in a 2D-Array of boolean or undefined.
 * 
 * - **undefined**    = Empty space
 * - **true**         = Alive cell
 * - **false**        = Dead cell
 */
export type CellStates = (boolean | undefined)[][]
/**
 * Class which contains state information and logic for Conways Game of Logic cell automata.
 */
export class GameOfLife {

    // ----- State information -----
    /**
     * Cells "alive" states are recorded in a 2-dimensional boolean array.
     * 
     * 'undefined' = no cell ever existed.
     * 'false' = a previous alive cell, now dead.
     */
    private cellStates: CellStates
    /**
     * Flip buffer for 'cellStates'. Used for efficiency in updating.
     */
    private cellStatesFlipBuffer: CellStates

    constructor(
        colCount: number,
        rowCount: number
    ) {
        // Initialize cellStates Arrays.
        this.cellStates = [[]]
        this.cellStatesFlipBuffer = [[]]
        this.handleResize(colCount, rowCount)
    }

    /**
     * Apply one cycle of Conways Game of Life logic.
     */
    cycle() {
        const cellStates = this.cellStates
        const bounds = {
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
    handleResize(colCount: number, rowCount: number) {
        // ----- Validate structure (length) of 'cellStates' and 'cellStatesFlipBuffer' -----
        const prevColCount = this.getColumnCount()
        const prevRowCount = this.getRowCount()
        const widthIncreased = colCount > prevColCount
        const heightIncreased = rowCount > prevRowCount

        if (widthIncreased)
            for (let i = prevColCount; i < colCount; i++) {
                this.cellStates.push([])
                this.cellStatesFlipBuffer.push([])
            }
        else {
            this.cellStates.length = colCount
            this.cellStatesFlipBuffer.length = colCount
        }

        for (let colIndex = 0; colIndex < colCount; colIndex ++) {
            if (heightIncreased)
                for (let i = prevRowCount; i < rowCount; i ++) {
                    this.cellStates[colIndex][i] = undefined
                    this.cellStatesFlipBuffer[colIndex][i] = undefined
                }
            else {
                this.cellStates[colIndex].length = rowCount
                this.cellStatesFlipBuffer[colIndex].length = rowCount
            }
        }
    }

    // ----- Interface for interacting with Game of Life state -----
    /**
     * Clears all cells.
     */
    clear() {
        const cellStates = this.cellStates
        const colLen = cellStates.length
        for (let colIndex = 0; colIndex < colLen; colIndex ++) {
            const rowLen = cellStates[colIndex].length
            for (let rowIndex = 0; rowIndex < rowLen; rowIndex ++) {
                cellStates[colIndex][rowIndex] = undefined
            }
        }
    }
    /**
     * Set the state of a Cell.
     * 
     * @param col   Column location
     * @param row   Row location
     * @param state Cell state
     */
    setCellState(col: number, row: number, state: boolean | undefined) {
        this.cellStates[col][row] = state
    }
    /**
     * Get the state of a Cell.
     * 
     * @param col   Column location
     * @param row   Row location
     * @return      Boolean or undefined, where
     * - **undefined**    = Empty space
     * - **true**         = Alive cell
     * - **false**        = Dead cell
     */
    getCellState(col: number, row: number): (boolean | undefined) {
        return this.cellStates[col][row]
    }

    // ----- Interface for separate Game of Life Renderer -----
    getCellStates(): CellStates {
        return this.cellStates
    }
    getColumnCount(): number {
        return this.cellStates.length
    }
    getRowCount(): number {
        return this.cellStates[0].length
    }

}
