static string JS_server_json = 
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief JavaScript JSON utility functions\n"
  "///\n"
  "/// @file\n"
  "///\n"
  "/// DISCLAIMER\n"
  "///\n"
  "/// Copyright 2010-2011 triagens GmbH, Cologne, Germany\n"
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
  "/// @author Copyright 2011, triAGENS GmbH, Cologne, Germany\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "// -----------------------------------------------------------------------------\n"
  "// --SECTION--                                                 AvocadoCollection\n"
  "// -----------------------------------------------------------------------------\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @addtogroup V8Json\n"
  "/// @{\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief string representation of a collection\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "AvocadoCollection.prototype.toString = function() {\n"
  "  var status;\n"
  "\n"
  "  if (this instanceof AvocadoCollection) {\n"
  "    status = this.status();\n"
  "\n"
  "    if (status == 1) {\n"
  "      return \"[new born collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else if (status == 2) {\n"
  "      return \"[unloaded collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else if (status == 3) {\n"
  "      return \"[collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else {\n"
  "      return \"[corrupted collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "  }\n"
  "  else {\n"
  "    return \"[object]\";\n"
  "  }\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief JSON representation of a collection\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "AvocadoCollection.prototype.toJSON = function() {\n"
  "  if (this instanceof AvocadoCollection) {\n"
  "    status = this.status();\n"
  "\n"
  "    if (status == 1) {\n"
  "      return \"[new born collection \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else if (status == 2) {\n"
  "      return \"[unloaded collection \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else if (status == 3) {\n"
  "      return \"[collection \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else {\n"
  "      return \"[corrupted collection \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "  }\n"
  "  else {\n"
  "    return \"[object]\";\n"
  "  }\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @}\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "// -----------------------------------------------------------------------------\n"
  "// --SECTION--                                                   AvocadoDatabase\n"
  "// -----------------------------------------------------------------------------\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @addtogroup V8Json\n"
  "/// @{\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief string representation of a vocbase\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "AvocadoDatabase.prototype.toString = function() {\n"
  "  if (this instanceof AvocadoDatabase) {\n"
  "    return \"[vocbase at \" + JSON.stringify(this._path) + \"]\";\n"
  "  }\n"
  "  else {\n"
  "    return \"[object]\";\n"
  "  }\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief JSON representation of a vocbase\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "AvocadoDatabase.prototype.toJSON = function() {\n"
  "  if (this instanceof AvocadoDatabase) {\n"
  "    return \"[vocbase at \" + JSON.stringify(this._path) + \"]\";\n"
  "  }\n"
  "  else {\n"
  "    return \"[object]\";\n"
  "  }\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @}\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "// -----------------------------------------------------------------------------\n"
  "// --SECTION--                                                      AvocadoEdges\n"
  "// -----------------------------------------------------------------------------\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @addtogroup V8Json\n"
  "/// @{\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief string representation of a vocbase\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "AvocadoEdges.prototype.toString = function() {\n"
  "  if (this instanceof AvocadoEdges) {\n"
  "    return \"[edges at \" + JSON.stringify(this._path) + \"]\";\n"
  "  }\n"
  "  else {\n"
  "    return \"[object]\";\n"
  "  }\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief JSON representation of a vocbase\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "AvocadoEdges.prototype.toJSON = function() {\n"
  "  if (this instanceof AvocadoEdges) {\n"
  "    return \"[edges at \" + JSON.stringify(this._path) + \"]\";\n"
  "  }\n"
  "  else {\n"
  "    return \"[object]\";\n"
  "  }\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @}\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "// -----------------------------------------------------------------------------\n"
  "// --SECTION--                                            AvocadoEdgesCollection\n"
  "// -----------------------------------------------------------------------------\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @addtogroup V8Json\n"
  "/// @{\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief string representation of an edges collection\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "AvocadoEdgesCollection.prototype.toString = function() {\n"
  "  var status;\n"
  "\n"
  "  if (this instanceof AvocadoEdgesCollection) {\n"
  "    status = this.status();\n"
  "\n"
  "    if (status == 1) {\n"
  "      return \"[new born collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else if (status == 2) {\n"
  "      return \"[unloaded collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else if (status == 3) {\n"
  "      return \"[collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else {\n"
  "      return \"[corrupted collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "  }\n"
  "  else {\n"
  "    return \"[object]\";\n"
  "  }\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief JSON representation of an edges collection\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "AvocadoEdgesCollection.prototype.toJSON = function() {\n"
  "  var status;\n"
  "\n"
  "  if (this instanceof AvocadoEdgesCollection) {\n"
  "    status = this.status();\n"
  "\n"
  "    if (status == 1) {\n"
  "      return \"[new born collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else if (status == 2) {\n"
  "      return \"[unloaded collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else if (status == 3) {\n"
  "      return \"[collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "    else {\n"
  "      return \"[corrupted collection at \" + JSON.stringify(this._name) + \"]\";\n"
  "    }\n"
  "  }\n"
  "  else {\n"
  "    return \"[object]\";\n"
  "  }\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @}\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "// -----------------------------------------------------------------------------\n"
  "// --SECTION--                                                AvocadoFluentQuery\n"
  "// -----------------------------------------------------------------------------\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief string representation of a query\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "AvocadoFluentQuery.prototype.toString = function() {\n"
  "  if (this instanceof AvocadoFluentQuery) {\n"
  "    return \"[query]\";\n"
  "  }\n"
  "  else {\n"
  "    return \"[object]\";\n"
  "  }\n"
  "}\n"
  "\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "/// @brief JSON representation of a query\n"
  "////////////////////////////////////////////////////////////////////////////////\n"
  "\n"
  "AvocadoFluentQuery.prototype.toJSON = function() {\n"
  "  if (this instanceof AvocadoFluentQuery) {\n"
  "    return \"[query]\";\n"
  "  }\n"
  "  else {\n"
  "    return \"[object]\";\n"
  "  }\n"
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
