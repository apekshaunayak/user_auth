
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));
const url = "mongodb://apekshanayak02_db_user:Apekshanayak@ac-v44wvbp-shard-00-00.lmwpsw7.mongodb.net:27017,ac-v44wvbp-shard-00-01.lmwpsw7.mongodb.net:27017,ac-v44wvbp-shard-00-02.lmwpsw7.mongodb.net:27017/?ssl=true&replicaSet=atlas-jf9h55-shard-0&authSource=admin";
const usersFile = path.join(__dirname, 'users.json');

let users = [];

if (fs.existsSync(usersFile)) {
    try {
        users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    } catch (error) {
        console.error('Error reading users.json:', error.message);
        process.exit(1);
    }
}

function saveUsers() {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-demo-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 1000 * 60 * 60
    }
}));

function requireLogin(request, response, next) {
    if (!request.session.user) {
        return response.redirect('/login');
    }

    next();
}

app.get('/', (request, response) => {
    if (request.session.user) {
        return response.redirect('/home');
    }

    response.redirect('/login');
});

app.get('/login', (request, response) => {
    if (request.session.user) {
        return response.redirect('/home');
    }

    response.render('login', { error: '' });
});

app.post('/login', async (request, response) => {
    const email = (request.body.email || '').trim().toLowerCase();
    const password = request.body.password || '';

    const user = users.find(item => item.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return response.status(401).render('login', {
            error: 'Invalid email or password. Please try again.'
        });
    }

    request.session.user = {
        name: user.name,
        email: user.email,
        branch: user.branch
    };

    response.redirect('/home');
});

app.get('/register', (request, response) => {
    if (request.session.user) {
        return response.redirect('/home');
    }

    response.render('register', {
        error: '',
        name: '',
        email: ''
    });
});

app.post('/register', async (request, response) => {
    const name = (request.body.name || '').trim();
    const email = (request.body.email || '').trim().toLowerCase();
    const password = request.body.password || '';
    const confirmPassword = request.body.confirmPassword || '';

    const showError = message => {
        return response.status(400).render('register', {
            error: message,
            name,
            email
        });
    };

    if (!name || !email || !password || !confirmPassword) {
        return showError('Please fill in all fields.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return showError('Please enter a valid email address.');
    }

    if (password.length < 8) {
        return showError('Password must contain at least 8 characters.');
    }

    if (password !== confirmPassword) {
        return showError('Passwords do not match.');
    }

    if (users.some(user => user.email === email)) {
        return showError('This email is already registered. Please log in.');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name: name,
            email: email,
            password: hashedPassword,
            branch: 'AIML'
        };

        users.push(newUser);

        try {
            saveUsers();
        } catch (error) {
            users.pop();
            console.error('Error saving user:', error.message);
            return showError('Could not save your account. Please try again.');
        }

        request.session.user = {
            name: newUser.name,
            email: newUser.email,
            branch: newUser.branch
        };

        response.redirect('/home');
    } catch (error) {
        console.error('Registration error:', error.message);
        return showError('Something went wrong. Please try again.');
    }
});

app.get('/home', requireLogin, (request, response) => {
    response.render('home', {
        name: request.session.user.name,
        email: request.session.user.email,
        branch: request.session.user.branch
    });
});

app.post('/logout', requireLogin, (request, response, next) => {
    request.session.destroy(error => {
        if (error) {
            return next(error);
        }

        response.clearCookie('connect.sid');
        response.redirect('/login');
    });
});

app.listen(3003, () => {
    console.log('Server is running on port 3003');
});