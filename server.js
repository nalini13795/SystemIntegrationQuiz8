const express = require('express')
const { check , validationResult} = require('express-validator');
const app = express();
const port = 3000;

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const cors = require('cors');

const options = {
    swaggerDefinition: {
      info: {
        title: 'Sample Swagger Docs',
        version: '1.0.0',
        description: 'This is a smaple documentation for a sample database'
      },
      host: 'localhost:3000',
      basePath: '/'
    },
    apis: ['./server.js'], // files containing annotations as above
  };
  
const specs = swaggerJsdoc(options);

app.use('/docs', swaggerUI.serve, swaggerUI.setup(specs));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mariadb = require('mariadb');
// const { query } = require('express');
const pool = mariadb.createPool({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'sample',
        port: 3306,
        connectionLimit:5
});

async function getRes(query) {
  let conn;
  try {
        conn = await pool.getConnection();
        const res = await conn.query(query);
        return res  
        } catch (err) {
            throw err;
        } finally {
        if (conn) conn.release(); //release to pool
  }
}

/**
 * @swagger
 * /agents:
 *   get:
 *     description: This API returns all the AGENTS object!
 *     produces:
 *         - application/json
 *     responses:
 *       200:
 *         description: The agent object with AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY is returned.
 */

app.get('/agents', async(req, res)=>{
        RunQuery = "SELECT * FROM agents";
        response = await getRes(RunQuery);
        res.json(response);
});

/**
 * @swagger
 * /company:
 *   get:
 *     description: This API returns all the COMPANY object!
 *     produces:
 *         - application/json
 *     responses:
 *       200:
 *         description: The COMPANY object with COMPANY_ID, COMPANY_NAME, COMPANY_CITY is returned.
 */

app.get('/company', async(req, res)=>{
        RunQuery = "SELECT * FROM company";
        response = await getRes(RunQuery);
        res.json(response);
});

/**
 * @swagger
 * /foods:
 *   get:
 *     description: This API returns all the FOOD object!
 *     produces:
 *         - application/json
 *     responses:
 *       200:
 *         description: The FOOD object with ITEM_ID, ITEM_NAME, ITEM_UNIT, COMPANY_ID returned.
 */

app.get('/foods', async(req, res)=>{
        RunQuery = "SELECT * FROM foods";
        response = await getRes(RunQuery);
        res.json(response);
});

/**
 * @swagger
 * /foods:
 *   post:
 *     parameters:
 *       - in: body
 *         name: Food Object
 *         required: true
 *         description: The Food object.
 *         schema:
 *           type: object
 *           properties:
 *             ITEM_ID:
 *               type: integer
 *               example: 1
 *             ITEM_NAME:
 *               type: string
 *               example: Tostitos
 *             ITEM_UNIT:
 *               type: string
 *               example: Pcs
 *             COMPANY_ID:
 *               type: integer
 *               example: 1 
 *     responses:
 *       200:
 *         description: Succesfully inserted Object in foods table.
 *       422:
 *         description: The food object was invalid
 *       400:
 *         description: Database error
*/
var PostfoodObjValidator =[
    check('ITEM_ID','ITEM_ID must not be empty').notEmpty().trim().escape().isInt().withMessage('ITEM_UNIT must be integer'),
    check('ITEM_NAME','ITEM_NAME must not be empty').notEmpty().trim().escape().isAlpha().withMessage('ITEM_NAME must be string'),
    check('ITEM_UNIT','ITEM_UNIT must not be empty').notEmpty().trim().escape(),
    check('COMPANY_ID','COMPANY_ID must not be empty').notEmpty().trim().escape().isInt().withMessage('COMPANY_ID must be integer'),
]

app.post(
    '/foods',PostfoodObjValidator , async(req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    else{
        let conn;
        try{
            conn = await pool.getConnection();
            RunQuery = `INSERT INTO foods (ITEM_ID, ITEM_NAME, ITEM_UNIT, COMPANY_ID) VALUES (${req.body.ITEM_ID},"${req.body.ITEM_NAME}","${req.body.ITEM_UNIT}", ${req.body.COMPANY_ID})`;
            const rows = await conn.query(RunQuery)
            res.json({"status":"success", "message":"Succesfully inserted Object in foods table"})
        }catch(e){
            res.status(400).json({"status":"failed", "error":`MySQL error. ${e.text}`})
        }  
    }
});

/**
 * @swagger
 * /foods:
 *   delete:
 *     parameters:
 *       - in: query
 *         name: ITEM_ID
 *         required: true
 *     responses:
 *       200:
 *         description: Succesfully deleted Object in foods table.
 *       422:
 *         description: The ITEM ID was invalid
 *       400:
 *         description: Database error
*/
var DeletefoodPram =[
    check('ITEM_ID','ITEM_ID must not be empty').notEmpty().trim().escape().isInt().withMessage('ITEM_ID must be integer')
]

app.delete(
    '/foods', DeletefoodPram , async(req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    else{
        let conn;
        try{
            conn = await pool.getConnection();
            RunQuery = `DELETE FROM foods where ITEM_ID = ${req.query.ITEM_ID}`;
            const rows = await conn.query(RunQuery)
            if(rows.affectedRows == 0){
                res.json({"status":"failed", "message":`No Food object with ID ${req.query.ITEM_ID}`})
            }else{
                res.json({"status":"success", "message":` Succesfully deleted Object in foods table with id ${req.query.ITEM_ID}`})
            }
        }catch(e){
            res.status(400).json({"status":"failed", "error":`MySQL error. ${e.text}`})
        }  
    }
});

/**
 * @swagger
 * /foods:
 *   put:
 *     parameters:
 *       - in: query
 *         name: ITEM_ID
 *         required: true
 *         example: 1
 *       - in: body
 *         name: Food Object
 *         required: true
 *         description: The Food object.
 *         schema:
 *           type: object
 *           properties:
 *             ITEM_ID:
 *               type: integer
 *               example: 1
 *             ITEM_NAME:
 *               type: string
 *               example: Tostitos
 *             ITEM_UNIT:
 *               type: string
 *               example: Pcs
 *             COMPANY_ID:
 *               type: integer
 *               example: 1 
 *     responses:
 *       200:
 *         description: Succesfully Updated Object in foods table.
 *       422:
 *         description: The food object was invalid
 *       400:
 *         description: Database error
*/
var PutfoodObjValidator =[
    check('ITEM_ID','ITEM_ID must not be empty').notEmpty().trim().escape().isInt().withMessage('ITEM_UNIT must be integer'),
    check('ITEM_NAME','ITEM_NAME must not be empty').notEmpty().trim().escape().isAlpha().withMessage('ITEM_NAME must be string'),
    check('ITEM_UNIT','ITEM_UNIT must not be empty').notEmpty().trim().escape(),
    check('COMPANY_ID','COMPANY_ID must not be empty').notEmpty().trim().escape().isInt().withMessage('COMPANY_ID must be integer'),
]

app.put(
    '/foods',PutfoodObjValidator , async(req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    else{
        let conn;
        try{
            conn = await pool.getConnection();
            RunQuery = `UPDATE foods SET ITEM_ID = ${req.body.ITEM_ID}, ITEM_NAME = "${req.body.ITEM_NAME}", ITEM_UNIT = "${req.body.ITEM_UNIT}" ,COMPANY_ID = ${req.body.COMPANY_ID} WHERE ITEM_ID = ${req.query.ITEM_ID}`;
            const rows = await conn.query(RunQuery)
            if(rows.affectedRows == 0){
                res.json({"status":"failed", "message":`No Food object with ID ${req.query.ITEM_ID}`})
            }else{
                res.json({"status":"success", "message":`Succesfully updated food Object with ID ${req.query.ITEM_ID}`})
            }
        }catch(e){
            res.status(400).json({"status":"failed", "error":`MySQL error. ${e.text}`})
        }  
    }
});



/**
 * @swagger
 * /foods/updateItemName:
 *   patch:
 *     parameters:
 *       - in: query
 *         name: ITEM_ID
 *         required: true
 *         example: 1
 *       - in: query
 *         name: ITEM_NAME
 *         required: true
 *         example: Tostitos
 *     responses:
 *       200:
 *         description: Succesfully Updated the Item Name in the food object.
 *       422:
 *         description: The ITEM ID or ITEM NAME was invalid
 *       400:
 *         description: Database Error
*/
var PatchfoodPram =[
    check('ITEM_ID','ITEM_ID must not be empty').notEmpty().trim().escape().isInt().withMessage('ITEM_ID must be integer'),
    check('ITEM_NAME','ITEM_NAME must not be empty').notEmpty().trim().escape().isAlpha().withMessage('ITEM_NAME must be string')
]

app.patch(
    '/foods/updateItemName', PatchfoodPram , async(req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    else{
        let conn;
        try{
            conn = await pool.getConnection();
            RunQuery = `UPDATE foods SET ITEM_NAME = "${req.body.ITEM_NAME}" WHERE ITEM_ID = ${req.query.ITEM_ID}`;
            const rows = await conn.query(RunQuery)
            if(rows.affectedRows == 0){
                res.json({"status":"failed", "message":`No Food object with ID ${req.query.ITEM_ID}`})
            }else{
                res.json({"status":"success", "message":` Succesfully updated item name in foods table with id ${req.query.ITEM_ID}`})
            }
        }catch(e){
            res.status(400).json({"status":"failed", "error":`MySQL error. ${e.text}`})
        }  
    }
});
app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
})  

