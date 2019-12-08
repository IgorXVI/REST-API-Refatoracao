const CustomError = require("./custom_error")

module.exports = class EndpointValidationError extends CustomError {
    constructor(errors=[new Object()]){
        super("EndpointValidationError", 400, errors)
    }
}