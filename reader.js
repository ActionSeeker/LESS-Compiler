fs = require('fs')
less = require('less')
var parser = new(less.Parser);
var XRegExp = require('xregexp');
var stack = require('stackjs');
var math = require('mathjs');

var variableRegex = /@[a-z][a-z0-9\-]*[\s]*[:][\s]*[\@a-z0-9#"",]*[\s]*[;]/gi

function eval(expression){
  if(expression[0]=='#'){
    if(expression.length != 4 && expression.length!=7){
      throw new Error("Hex value error in "+expression+". Will be printed as it is");
    }
  }
  //check for expression
  var hasLength, hasDegree, hasTime = true;

  lengthRegex = /cm|px|em|mm|m|inch/
  degreeRegex = /deg|rad|grad/
  timeRegex = /s|h|hr|mins|hours|hour|minutes/
  numberRegex = /[0-9][0-9.]*/
  signRegex = /\+|\-|\*|\//

  if(numberRegex.test(expression) == false){
    return expression;
  }

  if(signRegex.test(expression) == false){
    return expression;
  }

  rotateRegex = /rotate/

  rotateFunction = false;

  if(rotateRegex.test(expression)){
    rotateFunction = true;
  }

  expression = expression.replace(/px/,"cm");
  expression = expression.replace(/rotate/,"");

  hasLength = lengthRegex.test(expression);
  hasDegree = degreeRegex.test(expression);
  hasTime = timeRegex.test(expression);

  if(hasLength&&hasDegree || hasLength&&hasTime || hasDegree&&hasTime){
    //throw new Error("Incompatible types of operands in "+expression);
    return expression;
  }
  else{
    var _exp = math.parse(expression);
    _exp = _exp.compile().eval();
    //console.log(_exp.value);
    var unit = '';
    if(hasLength){
      unit = 'px';
      _exp.value = _exp.value*100;
    }
    else if(hasDegree){
      unit = 'deg';
      _exp.value = _exp.value*180/math.PI;
    }
    else if(hasTime){
      unit = 's';
    }
    if(rotateFunction){
      return 'rotate('+_exp.value+unit+')';
    }
    return _exp.value+unit;
  }
}

var VariableInfo = function(name,value){
  this.name = name,
  this.value = value,
  this.parent =  null,
  this.index = 0,
  this.type = 'simple'
}

VariableInfo.prototype.eval = function(){
  //Basically evaluate the this.value here, need to refer to less documentation
  //check if it is already evaluated or not
  //if not, then evaluate it
  //run a regex over the value, perhaps?
}

VariableInfo.prototype.setParent = function() {

};

var CSSproperty = function(nameValue){
  if(nameValue.trim()=='')return null;
  name = nameValue.split(':')[0];
  value = nameValue.split(':')[1];
  if( name==null || value==null )return null;
  this.name = name;
  this.value = value;
}

CSSproperty.prototype.evaluate = function () {
  //Evaluate the CSS property
  borderRegex = /border[\-]*.*/
  if(borderRegex.test(this.name) == true){
    //means a border property
    valueArray = this.value.split(" ");
    answerString = '';
    for(var j = 0;j<valueArray.length;j++){
      answerString += eval(valueArray[j]);
      answerString += ' ';
    }
    this.value = answerString;
  }
  else{
    this.value = eval(this.value);
  }
};

var Class = function(name){
  this.name = name;
  this.nameShortened = name.replace(/\(.*\)/,"");
  this.arguments = XRegExp.matchRecursive(name,'\\(','\\)',"gi")[0];
  this.fullname = name;
  this.fullClassDef = '';
  this.included = true;
  this.hasSubClass = false;
  this.CSSproperty = [];
  this.startIndex = 0;
  this.endIndex = 0;
  this.mixinClasses = [];
  this.argumentTable = [];
}

Class.prototype.getFullName = function(){
  //Gets the full qualified name of a class that would appear in the CSS file
  return this.fullname;
}

Class.prototype.addName = function(Class) {
  //Adds to the full qualified name of the class of given class object
  if(this.name[0] == '&'){
    this.name = this.name.replace(/&:/,"");
    this.fullname = Class.getFullName()+':'+this.name;
  }
  else{
    this.fullname = Class.getFullName() + ' '+this.name;
  }
};

Class.prototype.isIncluded = function(boolean){
  //This one is used to set whether a class is to be included in the final table or not
  this.included = boolean;
}

Class.prototype.addCSSProperty = function(CSSObject) {
  this.CSSproperty.push(CSSObject);
};

Class.prototype.sanitizeCSSProperty = function(){
  var _CSS = this.CSSproperty;
  for(var i = 0;i<_CSS.length;i++)
  {
    var obj = _CSS[i];
    tempObj = '';
    if(obj){
      tempObj = obj.value.replace(/[\s]*/,"");
    }
    if(typeof obj.name == "undefined" && typeof obj.value == "undefined"){
      _CSS.splice(i,1);
    }
    else if(tempObj[0]=='@'){
      _CSS.splice(i,1);
    }
    else{
      for(var j = i+1;j<_CSS.length;j++){
        if(_CSS[i].name == _CSS[j].name && _CSS[i].value == _CSS[j].value){
          _CSS.splice(j,1);
          --j;
        }
      }
    }
  }
  _CSS.reverse();
  for(var i = 0;i<_CSS.length;i++){
    for(var j = i+1;j<_CSS.length;j++){
      if(_CSS[i].name == _CSS[j].name){
        _CSS.splice(j,1);
        --j;
      }
    }
  }
  _CSS.reverse();
  this.CSSproperty = _CSS;
}

Class.prototype.CSSChange = function (variableName, variableValue) {
  console.log(variableName);
  console.log(variableValue);
  for(i = 0;i<this.CSSproperty.length;i++){
    var propertyRegex = new RegExp(variableName);
    if(propertyRegex.test(this.CSSproperty[i].value)){
      var insertString = this.CSSproperty[i].name+':'+variableValue;
      if(/rotate/.test(this.CSSproperty[i].value)){
        insertString = this.CSSproperty[i].name+':'+'rotate('+variableValue+')';
      }
      var CSSPropertyToBeInserted = new CSSproperty(insertString);
      CSSPropertyToBeInserted.evaluate();
      this.CSSproperty.push(CSSPropertyToBeInserted);
    }
  }
};

function getObject(name){
  for(var k = 0;k<basicClassTable.length;k++){
    if(basicClassTable[k].nameShortened == name){
      return basicClassTable[k];
    }
  }
  return null;
}

function createEndString(count){
  var str = ''
  for(var i = 0;i<count;i++){
    str+='}';
  }
  return str;
}

symbolTable = [];
basicClassTable = [];
subClassTable = [];

function createClassObject(className,classDef,leftIndex,rightIndex){
  var _classObject = new Class(className);
  _classObject.fullClassDef = classDef;
  _classObject.startIndex = leftIndex;
  _classObject.endIndex = rightIndex;
  return _classObject;
}

function extractSubClass(_classObject){
  if(!_classObject)return;
  var _cName = _classObject.name;
  if((_cName.match(/\(/g) || []).length){
    _classObject.isIncluded(false);
  }
  data = _classObject.fullClassDef;
  var subClassNames = XRegExp.matchRecursive(data,'{','}',"gi",{valueNames: ['className', null, 'classDef', null]});
  if(subClassNames.length==1);//Don't do anything
  else{
    for(var i = 0;i<subClassNames.length-1;i++){
      var name = subClassNames[i].value;
      var CSSPropertyRegex = /(.+?):(.+?);/gi;
      name = name.replace(CSSPropertyRegex,"");
      name = name.replace(/[\s]*/,"");
      var def = subClassNames[i+1];
      if(name.trim()!='' && def['name']=='classDef'){
        var _subClassObject = createClassObject(name,def.value,def['start'],def['end']);
        _classObject.hasSubClass = true;
        _subClassObject.addName(_classObject);
        subClassTable.push(_subClassObject);
        extractSubClass(_subClassObject);
      }
    }
  }
}

function isEmptyObject(obj){
  return Object.keys(obj).length === 0 && JSON.stringify(obj) === JSON.stringify({});
}

function extractCSSProperties(_classObject){
  var data = _classObject.fullClassDef;
  var subClassesCSS = XRegExp.matchRecursive(data,'{','}',"gi",{valueNames: ['className', null, 'classDef', null]});
  var subClassRegex = /[\.#a-z&][:a-z0-9\-]*[\(.*\)]*\{[;]*.*\}/gi
  if(subClassesCSS.length==1){
    CSSString = subClassesCSS[0].value;
    CSSString = CSSString.split(';');
    for(var j = 0;j<CSSString.length-1;j++){
      var property = new CSSproperty(CSSString[j]);
      if(isEmptyObject(property)==false) _classObject.addCSSProperty(property);
      else _classObject.mixinClasses.push(CSSString[j]);
    }
  }
  else{
    for(var i = 1;i<subClassesCSS.length;i+=2){
      var CSSString = _classObject.fullClassDef.replace(subClassRegex,"");
      CSSString = CSSString.split(';');
      for(var j = 0;j<CSSString.length-1;j++){
        var property = new CSSproperty(CSSString[j]);
        if(isEmptyObject(property)==false) _classObject.addCSSProperty(property);
        else _classObject.mixinClasses.push(CSSString[j]);
      }
    }
  }
}

var propertyString = '';

fs.readFile('style.less','utf8',function(err,data){
  fullFile = data;
  parser.parse(fullFile,function(err,tree){
    if(err){
      console.log(err);
    }
    else{

    }
  });

  breakIntoLines = data;
  breakIntoLines = breakIntoLines.split('\n');
  for(var i = 0;i<breakIntoLines.length;i++){
    breakIntoLines[i] = breakIntoLines[i].replace(/\/\/.*/,"");
  }

  var finalLines = '';

  for(var i = 0;i<breakIntoLines.length;i++){
    finalLines = finalLines+breakIntoLines[i]+'\n';
  }

  data = finalLines;

  data = data.replace(/[\r\n|\r|\n|\t|\v]*/gi,"");

  data = data.replace(/[\s]{2,}/g,"");

  data = data.replace(/\/\*.*\*\//gi,"");

  parseVariables(data);

  var data = data.replace(variableRegex,"")

  var classNames = XRegExp.matchRecursive(data,'{','}',"gi",{valueNames: ['className', null, 'classDef', null]});

  for(var i = 0;i<classNames.length-1;i = i+2){
    var classObject = createClassObject(classNames[i].value,classNames[i+1].value,classNames[i+1].start,classNames[i+1].end);
    basicClassTable.push(classObject);
  }

  for(var i = 0;i<basicClassTable.length;i++){
    extractSubClass(basicClassTable[i]);
  }

  for(var i = 0;i<basicClassTable.length;i++){
    extractCSSProperties(basicClassTable[i]);
  }

  for(var i = 0;i<subClassTable.length;i++){
    extractCSSProperties(subClassTable[i]);
  }

  //Extract the argument table

  for(var i = 0;i<basicClassTable.length;i++){
    //fill the argument table
    if(basicClassTable[i].arguments){
      _tempArgs = basicClassTable[i].arguments.split(",");
      //_tempArgs is now an array
      for(var j = 0;j<_tempArgs.length;j++){
        if(/:/.test(_tempArgs[j])){
          var _var = _tempArgs[j].split(':');
          _var[0] = _var[0].replace(/[\s]*/g,"");
          _var[1] = _var[1].replace(/\'/gi,"");
          basicClassTable[i].argumentTable.push(new VariableInfo(_var[0],_var[1]));
        }
        else{
          basicClassTable[i].argumentTable.push(new VariableInfo(_tempArgs[j],null));
        }
      }
    }
  }

  /*for(var i = 0;i<basicClassTable.length;i++){
    //Extract mixin arguments
    if(basicClassTable[i].mixinClasses.length >= 1){
      var array = basicClassTable[i].mixinClasses;
      for(var j = 0;j<array.length;j++){
        var arguments = XRegExp.matchRecursive(array[j], '\\(', '\\)', 'gi');
      }
    }
  }*/

  for(var i = 0;i<basicClassTable.length;i++){
    if(basicClassTable[i].mixinClasses.length >= 1){
      //push these object properties to CSS
      var array = basicClassTable[i].mixinClasses;
      for(var j = 0;j<array.length;j++){
        mixinName = array[j].replace(/\(.*\)/,"")
        getMixinArgs = XRegExp.matchRecursive(array[j],'\\(','\\)',"gi")[0];
        if(getMixinArgs){
          getMixinArgs = getMixinArgs.split(',');
          var _getObject = getObject(mixinName);

          for(var k = 0;k<getMixinArgs.length;k++){
            getMixinArgs[k] = getMixinArgs[k].replace(/\"/g,"");
            getMixinArgs[k] = getMixinArgs[k].replace(/\'/g,"");
          }
          if(_getObject && getMixinArgs.length>=1 && _getObject.argumentTable.length>=1){
            //Then fill this table on the fly
            for(var k = 0;k<_getObject.argumentTable.length && k < getMixinArgs.length;k++){
              //console.log(_getObject.argumentTable[k]);
              _getObject.argumentTable[k].value = getMixinArgs[k];
            }
            //Now reflect these changes in the CSS table of the _getObject
            for(var k = 0;k<_getObject.argumentTable.length;k++){
              _getObject.CSSChange(_getObject.argumentTable[k].name,_getObject.argumentTable[k].value);//variableName, value
            }
          }
        }
        if(_getObject){
          basicClassTable[i].CSSproperty = basicClassTable[i].CSSproperty.concat(_getObject.CSSproperty);
        }
      }
    }
  }

  //Mixin arguments

  for(var i = 0;i<subClassTable.length;i++){
    if(subClassTable[i].mixinClasses.length >=1){
      //push these object properties to CSS
      var array = basicClassTable[i].mixinClasses;
      for(var j = 0;j<array.length;j++){
        array[j] = array[j].replace(/\(.*\)/,"");
        var _getObject = getObject(array[j]);
        if(_getObject){
          //create the table on the fly
          //Add values of dummy variables
          //This is a temporary fix
        }
        if(_getObject){
          basicClassTable[i].CSSproperty = basicClassTable[i].CSSproperty.concat(_getObject.CSSproperty);
        }
      }
    }
  }

  for(var i = 0;i<basicClassTable.length;i++){
    basicClassTable[i].sanitizeCSSProperty();
  }

  for(var i = 0;i<subClassTable.length;i++){
    subClassTable[i].sanitizeCSSProperty();
  }

  for(var i = 0;i<basicClassTable.length;i++){
    var _CSS = basicClassTable[i].CSSproperty;
    for(var j = 0;j<_CSS.length;j++){
      _CSS[j].evaluate();
    }
  }

  for(var i = 0;i<subClassTable.length;i++){
    var _CSS = subClassTable[i].CSSproperty;
    for(var j = 0;j<_CSS.length;j++){
      _CSS[j].evaluate();
    }
  }

  //console.log(basicClassTable);
  //console.log(subClassTable);

  prettyPrintCSS();

  //console.log(extract('@list',3));

  fs.writeFile('style.css',propertyString,function(err,data){
    if(err){
      console.log(err);
      console.log(data);
    }
  })

});


function prettyPrintCSS(){
  for(var i = 0;i<basicClassTable.length;i++){
    if(basicClassTable[i].included){
      var _classString = '';
      _classString += basicClassTable[i].fullname;
      _classString += '{\r\n';
      var _CSS = basicClassTable[i].CSSproperty;
      for(var j = 0;j<_CSS.length;j++){
        _classString += '\t'+_CSS[j].name+': '+_CSS[j].value;
        _classString += ';\r'
      }
      _classString += '}\r\n';
      propertyString += _classString;
    }
  }

  for(var i = 0;i<subClassTable.length;i++){
    if(subClassTable[i].included){
      var _classString = '';
      _classString += subClassTable[i].fullname;
      _classString += '{\r\n';
      var _CSS = subClassTable[i].CSSproperty;
      for(var j = 0;j<_CSS.length;j++){
        _classString += '\t'+_CSS[j].name+': '+_CSS[j].value;
        _classString += ';\r'
      }
      _classString += '}\r\n';
      propertyString += _classString;
    }
  }
}



function parseVariables(file){
  /*Extract variable information from the file*/
  /*Extract two kinds of variables : ones that are done globally, and the ones that are in the scope*/
  /*This one is for the global variables*/
  while( (result = variableRegex.exec(file)) ){
    varDelim = result[0].split(';')[0];
    name = varDelim.split(':')[0];
    value = varDelim.split(':')[1];
    variable = new VariableInfo(name,value);
    variable.index = result['index'];
    variable.value = eval(variable.value);
    symbolTable.push(variable);
  }

  for(var i = 0;i<symbolTable.length;i++){
    //check if it is an array
    var commaCount = (symbolTable[i].value.match(/,/g) || []).length;
    if(commaCount >= 1){
      //create a new instance of array for this one
      var _fragments = symbolTable[i].value.split(',');
      for(var j = 0;j<_fragments.length;j++){
        _fragments[j] = _fragments[j].replace(/\"/gi,"");
        _fragments[j] = _fragments[j].replace(/\'/gi,"");
      }
      symbolTable[i].value = _fragments;
      symbolTable[i].type = 'array';
    }
  }

  //console.log(symbolTable);

}

/*Array functions */

function getArrayObject(variableName){
  for(var i = 0;i<symbolTable.length;i++){
    if(symbolTable[i].type=='array' && symbolTable[i].name == variableName){
      return symbolTable[i].value;
    }
  }
  return null;
}

function length(variable){
  var getArray = getArrayObject(variable);
  if(getArray == null)return 0;
  else return getArray.length;
}



function extract(variable,index){
  _array = getArrayObject(variable);
  if(typeof _array === "object" && _array!=null){
    //i.e. is an array
    if(index>_array.length){
      throw new Error("Index greater than its length");
    }
    else return _array[index];
  }
  else{
    throw new Error("Using extract on wrong item.");
    return null;
  }
}
