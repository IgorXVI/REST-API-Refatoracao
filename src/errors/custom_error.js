module.exports = class CustomError extends Error {
    constructor(name="InteralServerError", code=500, errors=[new Object()]){
        super("CustomError")

        this.name = name
        this.code = code
        this.errors = errors
    }
}