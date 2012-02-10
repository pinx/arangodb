static string JS_bootstrap_print = 
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief printing\n"
  "///\n"
  "/// @file\n"
  "///\n"
  "/// DISCLAIMER\n"
  "///\n"
  "/// Copyright 2010-2012 triagens GmbH, Cologne, Germany\n"
  "///\n"
  "/// Licensed under the Apache License, Version 2.0 (the \"License\");\n"
  "/// you may not use this file except in compliance with the License.\n"
  "/// You may obtain a copy of the License at\n"
  "///\n"
  "///     http://www.apache.org/licenses/LICENSE-2.0\n"
  "///\n"
  "/// Unless required by applicable law or agreed to in writing, software\n"
  "/// distributed under the License is distributed on an \"AS IS\" BASIS,\n"
  "/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n"
  "/// See the License for the specific language governing permissions and\n"
  "/// limitations under the License.\n"
  "///\n"
  "/// Copyright holder is triAGENS GmbH, Cologne, Germany\n"
  "///\n"
  "/// @author Dr. Frank Celler\n"
  "/// @author Copyright 2011-2012, triAGENS GmbH, Cologne, Germany\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "var internal = require(\"internal\");\n"
  "\n"
  "// -----------------------------------------------------------------------------\n"
  "// --SECTION--                                                          printing\n"
  "// -----------------------------------------------------------------------------\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @addtogroup V8Shell\n"
  "/// @{\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief prints objects to standard output\n"
  "///\n"
  "/// @FUN{print(@FA{arg1}, @FA{arg2}, @FA{arg3}, ...)}\n"
  "///\n"
  "/// Only available in shell mode.\n"
  "///\n"
  "/// Prints the arguments. If an argument is an object having a\n"
  "/// function @FN{PRINT}, then this function is called. Otherwise @FN{toJson} is\n"
  "/// used.  A final newline is printed\n"
  "///\n"
  "/// @verbinclude fluent40\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "function print () {\n"
  "  for (var i = 0;  i < arguments.length;  ++i) {\n"
  "    if (0 < i) {\n"
  "      internal.output(\" \");\n"
  "    }\n"
  "\n"
  "    PRINT(arguments[i], [], \"~\", []);\n"
  "  }\n"
  "\n"
  "  internal.output(\"\\n\");\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief prints objects to standard output without a new-line\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "function PRINT (value, seen, path, names) {\n"
  "  var p;\n"
  "\n"
  "  if (seen === undefined) {\n"
  "    seen = [];\n"
  "    names = [];\n"
  "  }\n"
  "\n"
  "  p = seen.indexOf(value);\n"
  "\n"
  "  if (0 <= p) {\n"
  "    internal.output(names[p]);\n"
  "  }\n"
  "  else {\n"
  "    if (value instanceof Object) {\n"
  "      seen.push(value);\n"
  "      names.push(path);\n"
  "    }\n"
  "\n"
  "    if (value instanceof Object) {\n"
  "      if ('PRINT' in value) {\n"
  "        value.PRINT(seen, path, names);\n"
  "      }\n"
  "      else if (value.__proto__ === Object.prototype) {\n"
  "        PRINT_OBJECT(value, seen, path, names);\n"
  "      }\n"
  "      else if ('toString' in value) {\n"
  "        internal.output(value.toString());\n"
  "      }\n"
  "      else {\n"
  "        PRINT_OBJECT(value, seen, path, names);\n"
  "      }\n"
  "    }\n"
  "    else if (value === undefined) {\n"
  "      internal.output(\"undefined\");\n"
  "    }\n"
  "    else {\n"
  "      internal.output(\"\" + value);\n"
  "    }\n"
  "  }\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @}\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "// -----------------------------------------------------------------------------\n"
  "// --SECTION--                                                             Array\n"
  "// -----------------------------------------------------------------------------\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @addtogroup V8Shell\n"
  "/// @{\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief JSON representation of an array\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "Array.prototype.PRINT = function(seen, path, names) {\n"
  "  if (this.length == 0) {\n"
  "    internal.output(\"[ ]\");\n"
  "  }\n"
  "  else {\n"
  "    var sep = \" \";\n"
  "\n"
  "    internal.output(\"[\");\n"
  "\n"
  "    for (var i = 0;  i < this.length;  i++) {\n"
  "      internal.output(sep);\n"
  "      PRINT(this[i], seen, path + \"[\" + i + \"]\", names);\n"
  "      sep = \", \";\n"
  "    }\n"
  "\n"
  "    internal.output(\" ]\");\n"
  "  }\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @}\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "// -----------------------------------------------------------------------------\n"
  "// --SECTION--                                                          Function\n"
  "// -----------------------------------------------------------------------------\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @addtogroup V8Shell\n"
  "/// @{\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief prints a function\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "Function.prototype.PRINT = function() {\n"
  "  internal.output(this.toString());\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @}\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "// -----------------------------------------------------------------------------\n"
  "// --SECTION--                                                            Object\n"
  "// -----------------------------------------------------------------------------\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @addtogroup V8Shell\n"
  "/// @{\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief string representation of an object\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "function PRINT_OBJECT (object, seen, path, names) {\n"
  "  var sep = \" \";\n"
  "\n"
  "  internal.output(\"{\");\n"
  "\n"
  "  for (var k in object) {\n"
  "    if (object.hasOwnProperty(k)) {\n"
  "      var val = object[k];\n"
  "\n"
  "      internal.output(sep, k, \" : \");\n"
  "      PRINT(val, seen, path + \"[\" + k + \"]\", names);\n"
  "      sep = \", \";\n"
  "    }\n"
  "  }\n"
  "\n"
  "  internal.output(\" }\");\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @}\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "// Local Variables:\n"
  "// mode: outline-minor\n"
  "// outline-regexp: \"^\\\\(/// @brief\\\\|/// @addtogroup\\\\|// --SECTION--\\\\|/// @page\\\\|/// @}\\\\)\"\n"
  "// End:\n"
;
