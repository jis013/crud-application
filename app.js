const express = require('express');
const exphbs = require('express-handlebars');
const dbo = require('./db');
const bodyparser = require('body-parser');

const app = express();
const ObjectId = dbo.ObjectId; 

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

app.engine('hbs', exphbs.engine({
    layoutsDir: 'views/',
    defaultLayout: 'main',
    extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', './views');

app.get('/', async (req, res) => {
    try {
        let database = await dbo.getDatabase(); 
        const collection = database.collection('books');
        let books = await collection.find({}).toArray();

        let message = '';
        let edit_id, edit_book;

        if (req.query.edit_id) {
            edit_id = req.query.edit_id;
            try {
                edit_book = await collection.findOne({ _id: new ObjectId(edit_id) });
            } catch (err) {
                console.error('Invalid ObjectId:', err);
            }
        }

        if(req.query.delete_id){
            await collection.deleteOne({_id: new ObjectId(req.query.delete_id)});
            return res.redirect('/?status=3');
        }

        switch (req.query.status) {
            case '1':
                message = 'Create Successfully!';
                break;
            case '2':
                message = 'Updated Successfully!';
                break;
                case '3':
                message = 'Deleted Successfully!';
                break;
            default:
                break;
        }

        res.render('main', { message, books, edit_id, edit_book});
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching data from database");
    }
});

app.post('/store_books', async (req, res) => {
    try {
        let database = await dbo.getDatabase(); 
        const collection = database.collection('books');
        let book = { title: req.body.title, author: req.body.author };
        await collection.insertOne(book);
        return res.redirect('/?status=1'); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Error inserting book");
    }
});

app.post('/update_books/:edit_id', async (req, res) => { 
    try {
        let database = await dbo.getDatabase(); 
        const collection = database.collection('books');
        let book = { title: req.body.title, author: req.body.author };
        
        let edit_id = req.params.edit_id;

        await collection.updateOne(
            { _id: new ObjectId(edit_id) }, 
            { $set: book }
        );
        return res.redirect('/?status=2'); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating book");
    }
});

app.listen(8000, () => {
    console.log('Listening on port 8000');
});