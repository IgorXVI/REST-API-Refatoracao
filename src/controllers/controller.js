"user strict"

const expressValidator = require("express-validator")

module.exports = class Controller {
    constructor() {
        this.checkSchema = expressValidator.checkSchema
        this.validationResult = expressValidator.validationResult

        this.flat = require("flat")
        this.sanitazeHtml = require("sanitize-html")

        this.EndpointValidationError = require("../errors/endpoint_validaton_error")
    }

    generateValidators(vSchema) {
        let validators = this.checkSchema(vSchema)

        validators.push(this.checkEndpointValidationErrors)
        
        validators.push(this.flatImportant)
        validators.push(this.sanitazeAll)
        validators.push(this.removeInvalidAttributes(vSchema))
        validators.push(this.unFlatImportant)

        return validators
    }

    flatImportant(req, res, next) {
        try {
            let obj = {
                body: {},
                query: {},
                params: {}
            }

            Object.assign(obj.body, req.body)
            Object.assign(obj.query, req.query)
            Object.assign(obj.params, req.params)

            let objFlat = this.flat(obj)

            req.flatImportant = objFlat

            next()
        }
        catch (error) {
            next(error)
        }
    }

    unFlatImportant(req, res, next) {
        try {
            let obj = {}
            Object.assign(obj, req.flatImportant)

            let objUnFlat = this.flat.unflatten(obj)

            req.body = objUnFlat.body
            req.query = objUnFlat.query
            req.params = objUnFlat.params

            delete req.flatImportant

            next()
        }
        catch (error) {
            next(error)
        }
    }

    sanitazeAll(req, res, next) {
        try {
            let objFlat = {}
            Object.assign(objFlat, req.flatImportant)

            Object.keys(objFlat).forEach(key => {
                if (typeof objFlat[key] === "string") {
                    objFlat[key] = this.sanitazeHtml(objFlat[key])
                }
            })

            req.flatImportant = objFlat

            next()
        }
        catch (error) {
            next(error)
        }
    }

    removeInvalidAttributes(vSchema) {
        return (req, res, next) => {
            try {
                let objFlat = {}
                Object.assign(objFlat, req.flatImportant)

                let allowAttrsObj = {
                    params: [],
                    query: [],
                    body: []
                }

                Object.keys(vSchema).forEach(key => {
                    const attr = vSchema[key]

                    attr.in.forEach(location => {
                        allowAttrsObj[location].push(key)
                    })
                })

                const match = new RegExp(/\.([0-9]+)\./, "g")

                Object.keys(objFlat).forEach(key => {
                    const pointIndex = key.indexOf(".")
                    const location = key.substring(0, pointIndex)

                    const kr = key.replace(`${location}.`, "").key.replace(match, "*")

                    if (!(allowAttrsObj[location].includes(kr))) {
                        delete objFlat[key]
                    }
                })

                req.flatImportant = objFlat

                next()
            }
            catch (error) {
                next(error)
            }
        }
    }

    checkEndpointValidationErrors(req, res, next) {
        try {
            const vResult = this.validationResult(req)

            if (vResult.isEmpty()) {
                next()
            }
            else {
                next(new this.EndpointValidationError(vResult.errors))
            }
        }
        catch (error) {
            next(error)
        }
    }
}