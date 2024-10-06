const fs = require('fs');


/**
 * Map class implementation to store key-value pairs
 */
class Map {
    constructor() {
        this.store = {};
    }

    /**
     * Set a value in the map for a given key
     * @param {string} key The key as a string
     * @param {any} value The value to store
     */
    set(key, value) {
        this.store[key] = value;
    }

    /**
     * Get a value from the map for a given key
     * @param {string} key The key as a string
     * @returns The value associated with the key, or undefined if not found
     */
    get(key) {
        return this.store.hasOwnProperty(key) ? this.store[key] : undefined;
    }

    /**
     * Check if the map contains a key
     * @param {string} key The key to check for
     * @returns {boolean} True if the key exists, otherwise false
     */
    has(key) {
        return this.store.hasOwnProperty(key);
    }

    /**
     * Iterate over all pairs in the map
     * @param {function} callback The callback function to execute for each pair
     */
    forEach(callback) {
        for (const key in this.store) {
            if (this.store.hasOwnProperty(key)) {
                callback(this.store[key], key);
            }
        }
    }
}

/**
 * Element representation of a single non-zero matrix element
 */
class MatrixValue {
    constructor(row, col, value) {
        this.row = row;
        this.col = col;
        this.value = value;
    }
}

/**
 * Sparse Matrix class using a Map for efficient lookups
 */
class Matrix {
    constructor(numRows, numCols) {
        this.numRows = numRows;
        this.numCols = numCols;
        this.elements = new Map();  // Using a Map to store matrix elements by (row, col) keys
    }

    /**
     * Load matrix from a file
     * @param {String} filePath File path to load the matrix from
     * @returns Sparse Matrix
     */
    static fromFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');

        const numRows = Matrix.extractNumber(lines[0], 'rows=');
        const numCols = Matrix.extractNumber(lines[1], 'cols=');

        const matrix = new Matrix(numRows, numCols);

        // Parse non-zero elements from file
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '') continue;

            let [row, col, value] = Matrix.extractValues(line);
            matrix.setElement(row, col, value);
        }

        return matrix;
    }

    /**
     * Set an element in the sparse matrix
     * @param {number} row The row index
     * @param {number} col The column index
     * @param {number} value The value of the element
     */
    setElement(row, col, value) {
        if (value !== 0) {
            this.elements.set(`${row},${col}`, value);  // Key format: "row,col"
        }
    }

    /**
     * Get element at specified position (returns 0 if not found)
     * @param {number} row The row index
     * @param {number} col The column index
     * @returns The value of the element, or 0 if not found
     */
    getElement(row, col) {
        return this.elements.get(`${row},${col}`) || 0;
    }

    /**
     * Add two sparse matrices
     * @param {Matrix} other The other matrix to add
     * @returns The sum of the two matrices
     */
    add(other) {
        if (this.numRows !== other.numRows || this.numCols !== other.numCols) {
            throw new Error("Matrix dimensions do not match for addition");
        }

        const result = new Matrix(this.numRows, this.numCols);

        // Add elements from both matrices
        this.elements.forEach((value, key) => {
            const [row, col] = key.split(',').map(Number);
            const sum = value + other.getElement(row, col);
            result.setElement(row, col, sum);
        });

        other.elements.forEach((value, key) => {
            if (!result.elements.has(key)) {
                const [row, col] = key.split(',').map(Number);
                result.setElement(row, col, value);
            }
        });

        return result;
    }

    /**
     * Subtract two sparse matrices
     * @param {Matrix} other Other matrix to subtract
     * @returns The difference of the two matrices
     */
    subtract(other) {
        if (this.numRows !== other.numRows || this.numCols !== other.numCols) {
            throw new Error("Matrix dimensions do not match for subtraction");
        }

        const result = new Matrix(this.numRows, this.numCols);

        // Subtract elements from both matrices
        this.elements.forEach((value, key) => {
            const [row, col] = key.split(',').map(Number);
            const diff = value - other.getElement(row, col);
            result.setElement(row, col, diff);
        });

        other.elements.forEach((value, key) => {
            if (!result.elements.has(key)) {
                const [row, col] = key.split(',').map(Number);
                result.setElement(row, col, -value);
            }
        });

        return result;
    }

    /**
     * Multiply two sparse matrices
     * @param {Matrix} other Other matrix to multiply
     * @returns The product of the two matrices
     */
    multiply(other) {
        if (this.numCols !== other.numRows) 
            throw new Error("Matrix dimensions do not match for multiplication");

        const result = new Matrix(this.numRows, other.numCols);

        this.elements.forEach((valueA, keyA) => {
            const [rowA, colA] = keyA.split(',').map(Number);

            other.elements.forEach((valueB, keyB) => {
                const [rowB, colB] = keyB.split(',').map(Number);
                if (colA === rowB) {
                    const product = valueA * valueB;
                    const currentVal = result.getElement(rowA, colB);
                    result.setElement(rowA, colB, currentVal + product);
                }
            });
        });

        return result;
    }

    /**
     * Method to extract numbers from the file line
     * @param {string} line The line to extract the number from
     * @param {string} prefix Line prefix
     * @returns The extracted number
     */
    static extractNumber(line, prefix) {
        if (!line.startsWith(prefix)) 
            throw new Error("Invalid file format");
        return parseInt(line.replace(prefix, '').trim());
    }

    /**
     * Method to extract values from the file line
     * @param {string} line The line to extract the values from
     * @returns The extracted values as an array [row, col, value]
     */
    static extractValues(line) {
        const startIndex = line.indexOf('(');
        const endIndex = line.indexOf(')');
        
        if (startIndex === -1 || endIndex === -1) 
            throw new Error("Invalid file format");
        
        const values = line.slice(startIndex + 1, endIndex).split(',');
        
        if (values.length !== 3) 
            throw new Error("Invalid file format");
        
        const row = parseInt(values[0].trim());
        const col = parseInt(values[1].trim());
        const value = parseInt(values[2].trim());
        
        return [row, col, value];
    }
}

/**
 * Main Program Code.
 */
if (require.main === module) {
    if (process.argv.length < 5) {
        console.log("\nUsage: node sparse_matrix <operation> <first_matrix_file_path> <second_matrix_file_path>\n");
        process.exit(1);
    }
    const operation = process.argv[2];
    const filePath1 = process.argv[3];
    const filePath2 = process.argv[4];
    let result;
    switch(operation){
        case "add":
            const matrixA = Matrix.fromFile(filePath1);
            const matrixB = Matrix.fromFile(filePath2);
            result = matrixA.add(matrixB);
            break;
        case "subtract":
            const matrixC = Matrix.fromFile(filePath1);
            const matrixD = Matrix.fromFile(filePath2);
            result = matrixC.subtract(matrixD);
            break;
        case "multiply":
            const matrixE = Matrix.fromFile(filePath1);
            const matrixF = Matrix.fromFile(filePath2);
            result = matrixE.multiply(matrixF);
            break;
        default:
            console.log("\nInvalid Operation. Allowed operations are add, subtract, and multiply.");
            process.exit(1);
    }

    // Output the result to a file
    const outputFilePath = `matrix_${operation}_result.txt`;
    const resultLines = [`rows=${result.numRows}`, `cols=${result.numCols}`];
    result.elements.forEach((value, key) => {
        const [row, col] = key.split(',');
        resultLines.push(`(${row}, ${col}, ${value})`);
    });

    fs.writeFileSync(outputFilePath, resultLines.join('\n'), 'utf-8');
    console.log(`Result written to ${outputFilePath}`);
}

module.exports = {
    Matrix,
    MatrixValue,
    Map
};
