'use strict'
//圧縮方： zip -r -D ../lambda_practice.zip *
const axios = require("axios");
const recaptcha_secret_key = process.env['recaptcha_secret_key'];


// Mailgun
const domain = 'oi-kaze.com';
const mailgun_secret_key = process.env['mailgun_secret_key'];
const mailgun = require('mailgun-js')({ apiKey:mailgun_secret_key, domain:domain });

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
};

let mail = (function (mailgun, domain) {
    let mail_content;
    mail_content = {
        from: `test太郎 <contact@${domain}>`,
        subject: `送信テスト`,
        to: null,
        text: null
    };

    return {
        set: function (form_data) {
            mail_content.to = `${form_data.name}様 <${form_data.email}>`;
            mail_content.text = `
            テストメールです。
            `;
            return  this;
        },
        send: async function () {
            let result = false;
            await mailgun.messages()
                .send(mail_content)
                .then(function(body) {result = true; return body})
                .catch(function(err) {return err})
            
            return  result;
        },
        fail: function (response) {
            response.body.date.message = "メール送信エラー";
            response.statusCode = 500;
            return  response;
        }
    };
})(mailgun, domain);

function getFormData(event){
    // formのキー
    const keys = ["name", "email"];

    var form_data = {};
    var key = "";
    for(var i = 0; i < Object.keys(keys).length; ++i) {
        key = keys[i];
        form_data[key] = event[key];
    }
    return form_data;
}

exports.handler = async (event) => {
    let response, result, form_data;
    
    response = {
        statusCode: 404,
        body: {
            result: false,
            message: "",
            data: {}
        }
    }
    result = null;

    //スパム対策
    result = await axios(recaptcha.getRecaptchaBody(event["bot_token"]));
    if (recaptcha.checkResult(result) === false) {
        return recaptcha.fail(response, result);
    }
    
    form_data = getFormData(event);
    
    //メール送信
    result = await mail.set(form_data).send();
    
    if (result === false) {
        return mail.fail(response);
    }
    
    response.statusCode = 200;
    response.body = {"result": true};
    
    return response;
};

