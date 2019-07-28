let express = require('express');

let app = express();

app.use(express.static('public'));
app.set('views', __dirname + '/views')
app.set('view engine','ejs');

let server = app.listen(3000,function(){
    console.log('listening to port 3000');
})


app.get('/',(req, res)=>{
    res.render('home.ejs');
})

app.get('/areaFind',(req, res)=>{
    res.render('areaFinder.ejs');
})