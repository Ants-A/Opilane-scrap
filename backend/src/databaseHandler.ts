import { SQL } from "bun";

const pg = new SQL(`postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_DATABASE}`);

async function test() {
    console.log(await pg`SELECT version()`);
}

export default test