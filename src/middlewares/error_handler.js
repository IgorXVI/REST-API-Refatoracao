const CustomError = require("../errors/custom_error")

// eslint-disable-next-line no-unused-vars
module.exports = (error, req, res, next) => {
    try {
        let errorJSON = {
            requestInfo: {
                path: req.path,
                method: req.method,
                body: req.body,
                query: req.query,
                params: req.params
            }
        }

        if (error instanceof CustomError) {
            errorJSON.name = error.name
            errorJSON.errors = error.errors
            res.status(error.code).json(errorJSON)
        }
        else {
            error.requestInfo = errorJSON.requestInfo
            console.log(error)
            res.status(500).end()
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).end()
    }
}