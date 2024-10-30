const axios = require('axios');

async function Fetcher() {
    await axios(
        'http://localhost:9090/graphql',
        {
            method: 'POST',
            body: JSON.stringify({
                query: `
                    query {
                        users(){
                            id
                            name
                        }
                    }
                `
            }),
        }
    )
    .then(response => {
        console.log(response.data);

    })
    .catch(error => console.error(error));
}

Fetcher();