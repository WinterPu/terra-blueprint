
相关的API https://clang.llvm.org/doxygen/group__CINDEX__TYPES.html

ref:
* https://stackoverflow.com/questions/25231080/what-are-canonical-types-in-clang
* usage: https://clang.llvm.org/docs/LibClang.html


```
// libclang_parser.cpp

// 定义递归访问函数

std::function<void(CXCursor)> visitNode = [&](CXCursor cursor) {

// 添加调试信息

CXCursorKind kind = clang_getCursorKind(cursor);

CXString cursor_kind_spelling = clang_getCursorKindSpelling(kind);

std::cout << "Cursor kind: " << clang_getCString(cursor_kind_spelling) << "\n";

clang_disposeString(cursor_kind_spelling);

  

// 处理所有声明和类型引用

if (clang_isDeclaration(kind) || clang_isReference(kind) || clang_isExpression(kind)) {

// 获取类型的完整字符串表示

CXType type = clang_getCursorType(cursor);

  

// 使用 CanonicalType 生成 key，和 cppast::to_string() 生成的格式一致

CXType canonical_type = clang_getCanonicalType(type);

CXString canonical_spelling = clang_getTypeSpelling(canonical_type);

std::string cppast_key = clang_getCString(canonical_spelling);

clang_disposeString(canonical_spelling);

  

// 同时获取 libclang 原始的类型字符串

CXString type_spelling = clang_getTypeSpelling(type);

std::string libclang_type = clang_getCString(type_spelling);

clang_disposeString(type_spelling);

  

// 获取 cursor 的“书写”，即它在源代码中的标识

CXString cursorSpelling = clang_getCursorSpelling(cursor);

std::cout <<"Cursor Spelling: " << clang_getCString(cursor_kind_spelling) << ": " << clang_getCString(cursorSpelling) << "\n";

  

CXCursor declCursor = clang_getTypeDeclaration(type);

if (!clang_Cursor_isNull(declCursor)) {

CXString typedefName = clang_getCursorSpelling(declCursor);

std::string source_typedef_name = clang_getCString(typedefName);

clang_disposeString(typedefName);

std::cout << "Typedef spelling as in source: " << source_typedef_name << std::endl;

}

std::cout << "Generated key: " << cppast_key << "\n";

std::cout << "Original libclang type: " << libclang_type << "\n" << std::endl;

if (!libclang_type.empty() && !cppast_key.empty()) {

pimpl_->type_spelling_map[cppast_key] = libclang_type;

}

}

  

// 递归访问子节点

clang_visitChildren(cursor,

[](CXCursor child, CXCursor parent, CXClientData client_data) {

auto& visit = *reinterpret_cast<std::function<void(CXCursor)>*>(client_data);

visit(child);

return CXChildVisit_Continue;

},

&visitNode);

};
```

```
// output result

Cursor kind: CXXMethod

Cursor Spelling: CXXMethod: preloadChannel

Typedef spelling as in source:

Generated key: int (const char *, const char *, unsigned int)

Original libclang type: int (const char *, const char *, agora::rtc::uid_t)

  

Cursor kind: ParmDecl

Cursor Spelling: ParmDecl: token

Typedef spelling as in source:

Generated key: const char *

Original libclang type: const char *

  

Cursor kind: ParmDecl

Cursor Spelling: ParmDecl: channelId

Typedef spelling as in source:

Generated key: const char *

Original libclang type: const char *

  

Cursor kind: ParmDecl

Cursor Spelling: ParmDecl: uid

Typedef spelling as in source: uid_t

Generated key: unsigned int

Original libclang type: agora::rtc::uid_t

  

Cursor kind: TypeRef

Cursor Spelling: TypeRef: agora::rtc::uid_t

Typedef spelling as in source: uid_t

Generated key: unsigned int

Original libclang type: agora::rtc::uid_t
```