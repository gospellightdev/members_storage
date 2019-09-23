const hbs = require('hbs');
const moment = require('moment');

hbs.registerHelper("formatDate", function(date, template){
    return moment(date).format(template);
});

hbs.registerHelper('ifCond', function (v1, operator, v2, trueVal, falseVal, options) {
    const ifTrue = typeof trueVal !== 'undefined' ? trueVal : (options.fn ? options.fn(this) : true);
    const ifFalse = typeof falseVal !== 'undefined' ? falseVal :  (options.inverse ? options.inverse(this) : false);

    switch (operator) {
        case '==':
            return (v1 == v2) ? ifTrue : ifFalse;
        case '===':
            return (v1 === v2) ? ifTrue : ifFalse;
        case '!=':
            return (v1 != v2) ? ifTrue : ifFalse;
        case '!==':
            return (v1 !== v2) ? ifTrue : ifFalse;
        case '<':
            return (v1 < v2) ? ifTrue : ifFalse;
        case '<=':
            return (v1 <= v2) ? ifTrue : ifFalse;
        case '>':
            return (v1 > v2) ? ifTrue : ifFalse;
        case '>=':
            return (v1 >= v2) ? ifTrue : ifFalse;
        case '&&':
            return (v1 && v2) ? ifTrue : ifFalse;
        case '||':
            return (v1 || v2) ? ifTrue : ifFalse;
        default:
            return ifFalse;
    }
});

module.exports = hbs;