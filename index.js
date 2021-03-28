'use strict'
//圧縮方： zip -r -D ../lambda_practice.zip *
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
    checkResult: function (verifyResult) {
        return verifyResult.data.success;
    },
    
    fail: function (response, verifyResult){
        response.statusCode = verifyResult.status;
        response.body.result = false;
        response.body.message = 'recaptcha failed';
        return response;
    }
}

exports.handler = async (event) => {

    let response = {
        statusCode: 404,
        body: {
            result: false,
            message: "",
            data: {}
        }
    }

    //スパム対策
    let result = await axios(recaptcha.getRecaptchaBody(event["bot_token"]));
    if (recaptcha.checkResult(result) === false) {
        return recaptcha.fail(response, result);
    }

    // TODO implement
    response.statusCode = 200;
    response.body = JSON.stringify('Hello from Lambda!');
    
    return response;
};

