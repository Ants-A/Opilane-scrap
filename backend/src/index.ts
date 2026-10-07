import express, { Request, Response } from 'express'; 
import { getSubjects } from './dbController';

const app = express()
const port = 8080


app.get("/subjects", async (req: Request, res: Response) => {
    const subjects = await getSubjects()
    res.json(subjects);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})