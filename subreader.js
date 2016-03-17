Class.prototype.extractClassProperty = function(){
  //extract basis properties, and remove all the subclasses inside it
  tempClassDef = this.fullClassDef;
  classNameRegex = new RegExp(this.name);
  tempClassDef = tempClassDef.replace(classNameRegex,"");
  if(tempClassDef[0]=='#'||tempClassDef[0]=='.'){
    tempClassDef = tempClassDef.substr(1);
  }
  tempClassDef = tempClassDef.substr(1);
  tempClassDef = tempClassDef.slice(0,-1);
  className = /[\.#a-z][a-z0-9\-]*[\(.*\)]*\{.*\}/gi;
  tempClassDef = tempClassDef.replace(className,"");
  this.propertyString = tempClassDef;
  this.propertyArray = tempClassDef.split(';');
}
function deriveSubClass(_class){
  if(_class == null)return;
  tempClass = _class.fullClassDef;
  regexClassRemove = new RegExp(_class.name);
  tempClass = tempClass.replace(regexClassRemove,"");
  if(tempClass[0]=='#'||tempClass[0]=='.'){
    tempClass = tempClass.substr(1);
  }
  //remove the last and the first {}
  tempClass = tempClass.substr(1);
  tempClass = tempClass.slice(0,-1);
  //parse this tempClass for variables, subclasses
  //check it it has any further subClasses, if not, add it to the properties
  classDefNI = /[\.a-z][a-z0-9\-]*\(/gi;
  classDef = /[\.#a-z][a-z0-9\-]*\{.*\}/gi;
  classNameNI = /[\.a-z][a-z0-9\-]*\(/i;
  className = /[\.#a-z][a-z0-9\-]*\{/i;
  while((result = classDef.exec(tempClass))){
    _class.hasSubClass = true;
    var name = className.exec(result[0])
    console.log(name[0]);
    name[0] = name[0].slice(0,-1);
    var _subClass = new Class(name[0]);
    _subClass.fullClassDef = result[0];
    _subClass.parent = _class.name;
    _subClass.fullname = _class.fullname+' '+name[0];
    subClassArray.push(_subClass);
    deriveSubClass(_subClass);
  }
}

function extractClassName(chunk){
  classNameNI = /[\.a-z][a-z0-9\-]*\(/i;
  className = /[\.#a-z][a-z0-9\-]*\{/i;
  var name = classNameNI.exec(chunk);
  var _className = '';
  if(name)//a class which is not to be included
  {
    _className = name[0];
    _className = _className.slice(0,-1);
    if(_className.trim()!==''){
      //console.log(_className);
      var _class = new Class(_className);
      _class.isIncluded(false);
      _class.fullClass(chunk);
      basicClassTable.push(_class);
      deriveSubClass(_class);
    }
  }
  else{
    name = className.exec(chunk);
    if(name)
    {
      _className = name[0];
      _className = _className.slice(0,-1);
      if(_className.trim()!==''){
        //console.log(_className);
        var _class = new Class(_className);
        _class.fullClass(chunk);
        basicClassTable.push(_class);
        deriveSubClass(_class);
      }

    }
  }
}

function createEndString(count){
  var str = ''
  for(var i = 0;i<count;i++){
    str+='}';
  }
  return str;
}
listOfBasicClasses = extractTopLevelClasses(fileWithoutVariables);
listOfBasicClasses = listOfBasicClasses.split('\r');

classRegex = /[\.#a-z][a-z0-9\-]*[\(.*\)]*\{.*\}/gi

while((result = classRegex.exec(fileWithoutVariables))){
  basicClassArray.push(result[0]);
}

for(var i = 0;i<listOfBasicClasses.length;i++){
  listOfBasicClasses[i] = listOfBasicClasses[i].replace("\n","");
  listOfBasicClasses[i] = listOfBasicClasses[i].replace(/\(.*\)/,"");
  listOfBasicClasses[i] = listOfBasicClasses[i].replace(/[\s]*/gi,"");
}

for(var i = 0;i<basicClassArray.length;i++){
    extractClassName(basicClassArray[i]);
}

for(var i = 0;i<basicClassArray.length;i++){
  extractClassName(basicClassArray[i]);
}

for(var i = 0;i<basicClassTable.length;i++){
  var _className = basicClassTable[i].name;
  if(_className[0]=='.'||_className[0]=='#'){
    _className = _className.split(0,-1);
    _className = _className[0];
  }
  if(listOfBasicClasses.indexOf(_className) == -1){
    //This item is not supposed to be here.
    //So first, we will cut it from here and paste it to the definiton of previous one
    basicClassTable[i-1].fullClassDef += basicClassTable[i].fullClassDef;
    //Then we will delete this entry
    basicClassTable.splice(i,1);
  }
}

for(var i = 0;i<basicClassTable.length;i++){
  basicClassTable[i].improveFullClass();
  basicClassTable[i].extractClassProperty();
}

for (var i = 0; i < basicClassTable.length; i++) {
  deriveSubClass(basicClassTable[i]);
}

for (var i = 0; i < subClassArray.length; i++) {
  subClassArray[i].extractClassProperty();
}

console.log(basicClassTable);
console.log(subClassArray);
