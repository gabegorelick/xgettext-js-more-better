'use strict';

var falafel = require('falafel');
var Catalog = require('gettext-catalog');

function extract (source, options) {
  options = options || {};

  var filename = options.filename;
  var catalog = new Catalog(options);

  falafel(source, {locations: true}, function (node) {
    if (!node || node.type !== 'CallExpression' || !node.callee) {
      // not the right kind of AST node
      return;
    }

    var callee = node.callee;

    var id;
    if (callee.type === 'Identifier') {
      // expressions like `gettext('Foo')`
      id = callee.name;
    } else if (callee.type === 'MemberExpression') {
      // expression like `i18n.gettext('Foo')`
      if (!callee.property || callee.property.type !== 'Identifier') {
        return;
      }

      id = callee.property.name;
    } else {
      return;
    }

    if (Object.keys(catalog.identifiers).indexOf(id) === -1) {
      // not a gettext function
      return;
    }

    var spec = catalog.identifiers[id];
    var params = node.arguments;
    var msgidParam = params[spec.indexOf('msgid')];

    if (!msgidParam) {
      // don't extract gettext() without param
      return;
    }

    var msgid = (function () {
      var extractMsgid = function (node) {
        if (node.type === 'Literal') {
          return node.value;
        }

        if (node.type === 'BinaryExpression' && node.operator === '+') {
          return extractMsgid(node.left) + extractMsgid(node.right);
        }

        return '';
      };

      return extractMsgid(msgidParam);
    })();
    if (!msgid) {
      return;
    }

    var contextIndex = spec.indexOf('msgctxt');

    var context = null; // null context is *not* the same as empty context
    if (contextIndex >= 0) {
      var contextParam = params[contextIndex];
      if (!contextParam) {
        // throw an error if there's supposed to be a context but not enough
        // parameters were passed to the handlebars helper
        throw new Error('Expected a context for msgid "' + msgid + '" but none was given');
      }
      if (contextParam.type !== 'Literal') {
        throw new Error('Context must be a string literal (msgid "' + msgid + '")');
      }

      context = contextParam.value;
    }

    var domain = catalog.defaultDomain;
    var domainIndex = spec.indexOf('domain');
    if (domainIndex !== -1) {
      var domainParam = params[domainIndex];
      if (!domainParam) {
        throw new Error('Expected a domain for msgid "' + msgid + '" but none was given');
      }
      if (domainParam.type !== 'Literal') {
        throw new Error('Domain must be a string literal (msgid "' + msgid + '")');
      }

      domain = domainParam.value;
    }

    // make sure plural forms match
    var pluralIndex = spec.indexOf('msgid_plural');
    var plural = null;
    if (pluralIndex !== -1) {
      var pluralParam = params[pluralIndex];
      if (!pluralParam) {
        throw new Error('No plural specified for msgid "' + msgid + '"');
      }
      if (pluralParam.type !== 'Literal') {
        throw new Error('Plural must be a string literal for msgid ' + msgid);
      }

      plural = pluralParam.value;
    }

    var message = {};
    message[domain] = {};
    var key = catalog.messageToKey(msgid, context);
    message[domain][key] = {
      msgid: msgid,
      msgctxt: context,
      msgid_plural: plural,
      references: [
        {
          filename: filename,
          firstLine: node.loc.start.line,
          firstColumn: node.loc.start.column,
          lastLine: node.loc.end.line,
          lastColumn: node.loc.end.column
        }
      ],
      extractedComments: [] // TODO
    };

    catalog.addMessages(message);
  });

  return catalog;
}

module.exports = extract;
