/**
 * zenDOM
 * Create dom objects or HTML code by javascript using emmet-like syntax
 *
 *
 *
 * element:
 * div#id.class[attr1=value1 attr2=value\ 2 attr3=value3]{textnode}
 * 
 * structure:
 * element>element+element^element<element
 *
 * return: object with method:
 * getDOM(): get all DOM tree
 * getHTML(): get generated HTML
 * appendTo(domObj): append all element generated to domObj as children.
 *
 * authour: Kevin Huang <600ghz@gmail.com>
 *
 * License: MIT
 */

var zenDOM = function(template) {
	if (!template) throw "Do not pass an empty string to me"
	var dce = function(t) { return document.createElement(t); },
		dtn = function(t) { return document.createTextNode(t); },
		escapeBackSlashes = function(unesc, str) {
			var re = new RegExp('\\\\([' + unesc.replace(/([\]\}\!\?\^\\\*\(\)\-\+\=\<\>\/])/g, '\\$1') + '])', 'g');
			return str.replace(re, '$1');
		};
	var unitReg = /\s*([<>\^\+])\s*((?:[^<>\^\+]*?(?:\[(?:\\\]|[^\]])*\])*?(?:{(?:\\}|[^\}])*})*?)+)/g,
		elementReg = /((^|#|\.)(\w+)|\[(?:\\\]|[^\]])+\]|\{(?:\\\}|[^\}])+\})+?/g,
		attrReg = /([^\s=]+)(=((?:\\\s|[^\s])*))?/g;

	var dom = dce('div');
	var unit, rootElement, op, elementString, undef;
	var createElement = function(elementString) {
		var element, attrStr, attr, className, id, text, textNode;

		while(null !== (part = elementReg.exec(elementString))) {
			switch (true) {
				case part[2] === undef: //[] or {} part
					if (part[1].substr(0, 1) === '{' && part[1].substr(-1) === '}') { //Text node
						text = escapeBackSlashes('}', part[1].substr(1, part[1].length - 2));
						text = text.replace(/  /g, '\u00A0\u00A0');
						text = text.replace(/\\n/g, '\u000A');
						textNode = dtn(text);
					}
					if (!textNode && part[1].substr(0, 1) === '[' && part[1].substr(-1) === ']') { //attribute 
						attrStr = part[1].substr(1, part[1].length - 2);
						while(null !== (attr = attrReg.exec(attrStr))) { //please ensure tag write at head of unit
							var tmp = escapeBackSlashes(' ]', attr[3] || '');
							if (/^[a-z_]/gi.test(attr[1])) element.setAttribute(attr[1], tmp);
							else throw "Error for \"" + elementString + "\", Attribute of element must start with letters or underline";
						}
					}
					break;
				case part[2] === '': //tag
					element = dce(part[3]);
					break;
				case part[2] === '.': //class name
					className = part[3];
					break;
				case part[2] === '#': //id
					id = part[3];
					break;
			}
		}
		if (element) {
			if (className) element.className = className;
			if (id) element.id = id;
			if (textNode) element.appendChild(textNode);
			return element;
		} else {
			return textNode;
		}
	};

	rootElement = dom;
	while(null !== (unit = unitReg.exec('>' + template))) {
		op = unit[1];
		elementString = unit[2];
		if (elementString =='') {
			if (op == '<' || op == '^') rootElement = rootElement.parentElement || rootElement;
			else throw "missing element string near: " + template.substr(unitReg.lastIndex - 5 || 0, 9);
			continue;
		}

		element = createElement(elementString);
		if (!element) continue;
		switch (op) {
			case '>':
				rootElement.appendChild(element);
				break;
			case '+':
				rootElement.parentElement.appendChild(element);
				break;
			case '<':
			case '^':
				rootElement = rootElement.parentElement || rootElement;
				rootElement = rootElement.parentElement || rootElement;
				rootElement.appendChild(element);
				break;
		}
		rootElement = element;
	}

	rootElement = null;
	return {
		getDOM: function() {
			return dom.cloneNode(true).childNodes;
		},
		getHTML: function() {
			return dom.innerHTML;
		},
		appendTo: function(domObject) {
			var node, i, l = dom.childNodes.length;
			if (!!domObject && domObject instanceof HTMLElement && l) for (i = 0; i < l; i++) {
				domObject.appendChild(dom.childNodes[i].cloneNode(true));
			}
		}
	};
};
