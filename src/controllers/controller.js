"user strict"

const expressValidator = require("express-validator")

module.exports = class Controller {
    constructor() {
        this.checkSchema = expressValidator.checkSchema
        this.validationResult = expressValidator.validationResult

        this.flat = require("flat")
        this.sanitazeHtml = require("sanitize-html")

        this.CustomError = require("../errors/custom_error")
        this.EndpointValidationError = require("../errors/endpoint_validaton_error")
    }

    get test() {
        let middlewares = this.generateValidators({
            id: {
                in: ["body", "params", "query"],
                isInt: true,
                toInt: true
            },
            "banana.*.id": {
                in: ["body", "params", "query"],
                isInt: true,
                toInt: true
            },
            "banana.*.str": {
                in: ["body", "params", "query"],
                optional: true
            }
        })

        middlewares.push(this.serveTest)

        return middlewares
    }

    serveTest(req, res, next) {
        try {
            console.log(JSON.stringify(req.body, null, 2))
            res.status(200).json({
                sucesso: true
            })
        }
        catch (error) {
            next(error)
        }
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

    get flatImportant() {
        const flat = this.flat

        return (req, res, next) => {
            try {
                let obj = {
                    body: {},
                    query: {},
                    params: {}
                }

                Object.assign(obj.body, req.body)
                Object.assign(obj.query, req.query)
                Object.assign(obj.params, req.params)

                let objFlat = flat(obj)

                req.flatImportant = objFlat

                next()
            }
            catch (error) {
                next(error)
            }
        }
    }

    get unFlatImportant() {
        const flat = this.flat

        return (req, res, next) => {
            try {
                let obj = {}
                Object.assign(obj, req.flatImportant)

                let objUnFlat = flat.unflatten(obj)

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
    }

    get sanitazeAll() {
        const sanitazeHtml = this.sanitazeHtml

        return (req, res, next) => {
            try {
                let objFlat = {}
                Object.assign(objFlat, req.flatImportant)

                Object.keys(objFlat).forEach(key => {
                    if (typeof objFlat[key] === "string") {
                        objFlat[key] = sanitazeHtml(objFlat[key])
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

                    if (pointIndex !== -1) {
                        const location = key.substring(0, pointIndex)

                        const kr = key.replace(`${location}.`, "").replace(match, ".*.")

                        if (!(allowAttrsObj[location].includes(kr))) {
                            delete objFlat[key]
                        }
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

    get checkEndpointValidationErrors() {
        const validationResult = this.validationResult

        return (req, res, next) => {
            try {
                const vResult = validationResult(req)

                if (!(vResult.isEmpty())) {
                    throw new this.EndpointValidationError(vResult.errors)
                }

                next()
            }
            catch (error) {
                next(error)
            }
        }
    }
}