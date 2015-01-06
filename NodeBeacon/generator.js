/*jshint browser: true */
module.exports = function Generator() {
    this.templates = [];
    this.wordLists = {};
    
    this._replaceFunc = this._replaceFunc.bind(this);
};

// Oculus-enabled smartphone app
/* Templates take the form of "{product}-enabled {projectType}" */
module.exports.prototype = {
    templates: null,
    wordLists: null,
    
    randomItem: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    _replaceFunc: function(match, list, optional) {
        if(!this.wordLists[list]) {
            return "missing wordlist " + list;
        }
        if(!optional || (optional && Math.random() > 0.5)) {
            return this.randomItem(this.wordLists[list]);
        } else return "";
    },
    
    generate: function() {
        //first, pick a template
        if(this.templates.length === 0) return null;
        
        var template = this.randomItem(this.templates);
        
        //now, perform some replacements
        
        while(template.indexOf("{") !== -1) {
        
            template = template.replace(/\{(\w+)(\?)?\}/g, this._replaceFunc);
        }
        
        return template;
    }
};