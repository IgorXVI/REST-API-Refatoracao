const app = require("./src/config/custom_express")

const port = 6663
app.listen(port, ()=>{
    console.log(`ouvindo na porta ${port}`)
})