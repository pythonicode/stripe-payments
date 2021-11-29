const fs = require('fs')

if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

const stripe = require('stripe')(stripeSecretKey)
const express = require('express')
const app = express()

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))

app.get('/store', (req, res) => {
    fs.readFile('items.json', (err, data) => {
        if(err) res.status(500).end()
        else res.render('store.ejs', {
            stripePublicKey: stripePublicKey,
            items: JSON.parse(data)
        })
    })
})

app.post('/purchase', (req, res) => {
    fs.readFile('items.json', (err, data) => {
        if(err) res.status(500).end()
        else {
            const itemsJSON = JSON.parse(data)
            const items = itemsJSON.music.concat(itemsJSON.merch)
            let total = 0
            req.body.items.forEach(item => {
                const itemJSON = items.find(i => {
                    return i.id == item.id
                })
                total += itemJSON.price * item.quantity
            })
            stripe.charges.create({
                amount: total,
                source: req.body.stripeTokenId,
                currency: 'usd'
            }).then(() =>{
                console.log('Credit charge was successful...')
                res.json({message: 'Successfully purchased items!'})
            }).catch(err => {
                console.error(err)
                res.status(500).end()
            })
        }
    })
})

app.listen(3000)