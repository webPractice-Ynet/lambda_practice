'use strict'
//圧縮方： zip -r -D ../test.zip *
const axios = require("axios");
const recaptcha_secret_key = process.env['recaptcha_secret_key'];

let recaptcha = {

    getRecaptchaBody: function (token) {
        return {
            method: 'post',
            url: `https://www.google.com/recaptcha/api/siteverify`,
            params: {
                secret: recaptcha_secret_key,
                response: token
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "*/*",
            }
        }
    },
    fail: function (response, verifyResult){
        response.statusCode = verifyResult.status;
        response.body.result = false;
        response.body.message = 'recaptcha failed';
        return response;
    }
}

exports.handler = async (event) => {

    var response = {
        statusCode: 404,
        body: {
            result: false,
            message: "",
            data: {}
        }
    }

    //Bot対策
    var verifyResult = await axios(recaptcha.getRecaptchaBody(event["bot_token"]));
    if (verifyResult.data.success === false) {
        return recaptcha.fail(response, verifyResult);
    }

    // TODO implement
    response.statusCode = 200;
    response.body = JSON.stringify('Hello from Lambda!');
    
    return response;
};

