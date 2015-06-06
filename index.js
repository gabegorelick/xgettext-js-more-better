'use strict';

var falafel = require('falafel');
var Catalog = require('gettext-catalog');
var assign = require('lodash.assign');

function extract (source, gettextOptions, acornOptions) {
  gettextOptions = gettextOptions || {};

  var filename = gettextOptions.filename;
  var catalog = new Catalog(gettextOptions);

  // caller can turn off locations if they want by passing locations:false
  acornOptions = assign({locations: true}, acornOptions);

  falafel(source, acornOptions, function (node) {
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
      if (!callee.property) {
        return;
      }

      if (callee.property.type === 'Identifier') {
        // i18n.gettext
        id = callee.property.name;
      } else if (callee.property.type === 'Literal') {
        // i18n["gettext"]
        id = callee.property.value;
      } else {
        return;
      }
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

    var invalidMsgid;
    var msgid = (function () {
      var extractMsgid = function (node) {
        if (invalidMsgid) {
          // stop recursing if we already know this node isn't a valid msgid
          return;
        }

        if (node.type === 'Literal') {
          return node.value;
        }

        if (node.type === 'BinaryExpression' && node.operator === '+') {
          return extractMsgid(node.left) + extractMsgid(node.right);
        }

        // common example of this is something like
        // gettext('Hello ' + user),
        // i.e. where some part of msgid isn't a literal
        invalidMsgid = true;
      };

      return extractMsgid(msgidParam);
    })();
    if (!msgid || invalidMsgid) {
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
    var loc = node.loc || {
      // locations can be turned off to increase parse speed if users really want
      start: {line: null, column: null},
      end: {line: null, column: null}
    };
    message[domain][key] = {
      msgid: msgid,
      msgctxt: context,
      msgid_plural: plural,
      references: [
        {
          filename: filename,
          firstLine: loc.start.line,
          firstColumn: loc.start.column,
          lastLine: loc.end.line,
          lastColumn: loc.end.column
        }
      ],
      extractedComments: [] // TODO
    };

    catalog.addMessages(message);
  });

  return catalog;
}

module.exports = extract;
