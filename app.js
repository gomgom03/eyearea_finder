let express = require('express');

let app = express();

app.use(express.static('public'));
app.set('views', __dirname + '/views')
app.set('view engine','ejs');

let server = app.listen(process.env.PORT || 8080,function(){
    console.log('listening to port 8080');
})


app.get('/',(req, res)=>{
    res.render('home.ejs');
})

app.get('/areaFind',(req, res)=>{
    res.render('areaFinder.ejs');
})