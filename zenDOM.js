/**
 * zenDOM
 * Create dom objects or HTML code by javascript using emmet-like syntax
 *
 * authour: Kevin Huang <600ghz@gmail.com>
 *
 *
 * element:
 * div#id.class[attr1=value1 attr2=value\ 2 attr3=value3]{textnode}
 * 
 * structure:
 * element>element+element^element<element
 *
 * return: documentFragment object with method:
 * getHTML(): get generated HTML
 * appendTo(domObj): append all element generated to domObj as children.
 *
 * Usage:
 * var str = 'div#space1.box1>ul+li{text1}+li{text2}^^p{demo string}>span<#space1+div';
 * var dom = zen(str);
 * var nodes = dom.childNodes;
 * var html = dom.getHTML();
 * var nodes = dom.appendTo(document.body);
 *
 * **NOTE** in javascript, you should use "\\" to generate one backslash.
 * E.g.,
 * var str = 'div[attr1=value\\ 1 attr2=value} attr3=mark_\\]_and_\\\\_in_value]{text, mark\\}, and 3   spaces}';
 * var html = zen(str).getHTML();
 * html should be:
 * <div attr1="value 1" attr2="value}" attr3="mark_]_and_\_in_value">text, mark }, and 3&nbsp;&nbsp; spaces</div>
 *
 *
 * License: MIT
 */

(function(window) {
	var zen = function(template) {
		if (!template) throw "Do not pass an empty string to me";
		var escapeBackSlashes = function(unesc, str) {
				var re = new RegExp('\\\\([' + unesc.replace(/([\]\}\!\?\^\\\*\(\)\-\+\=\<\>\/])/g, '\\$1') + '])', 'g');
				return str.replace(re, '$1');
			};
		var 
			//unitReg = /\s*([<>\^\+])\s*((?:[^<>\^\+]*?(?:\[(?:\\\]|[^\]])*\])*?(?:{(?:\\}|[^\}])*})*?)+)/g,
			//Regular expression above does not work in IE
			unitReg = /\s*([<>\^\+])\s*((?:[^<>\^\+\{\[]*(?:\[(?:\\\]|[^\]])*\])*(?:{(?:\\}|[^\}])*})*)+)/g,
			elementReg = /((^|#|\.)(\w+)|\[(?:\\\]|[^\]])+\]|\{(?:\\\}|[^\}])+\})+?/g,
			attrReg = /([^\s=]+)(=((?:\\\s|[^\s])*))?/g;

		var dom = document.createDocumentFragment();
		var unit, element, rootElement, op, elementString, undef;
		var createElement = function(elementString) {
			var part, element, attrStr, attr, classNames = [], id, text, textNode;

			while(null !== (part = elementReg.exec(elementString))) {
				switch (true) {
					case part[2] === undef: //[] or {} part
						if (part[1].substr(0, 1) === '{' && part[1].substr(-1) === '}') { //Text node
							text = escapeBackSlashes('}', part[1].substr(1, part[1].length - 2));
							text = text.replace(/  /g, '\u00A0\u00A0');
							text = text.replace(/\\n/g, '\u000A');
							textNode = document.createTextNode(text);
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
						element = document.createElement(part[3]);
						break;
					case part[2] === '.': //class name
						classNames.push(part[3]);
						break;
					case part[2] === '#': //id
						id = part[3];
						break;
				}
			}
			if (element) {
				if (classNames.length > 0) element.className = classNames.join('');
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
			if (elementString == '') {
				if (op == '^') {
					rootElement = (rootElement.parentElement || rootElement.parentNode) || rootElement;
					continue;
				} else {
					throw "missing element string near: \"" + template.substr(unitReg.lastIndex - 5 || 0, 9) + "\" in string \"" + template + "\"";
				}
			}

			if (op == '<') {
				rootElement = (function(tmpRoot, elmtStr) {
					var isTarget, part, attrStr, attr;
					while (tmpRoot) {
						if (tmpRoot.nodeType != 1) {
							tmpRoot = (tmpRoot.parentElement || tmpRoot.parentNode) || null;
							continue;
						}
						isTarget = true;
						while(null !== (part = elementReg.exec(elmtStr))) { //make sure that is html element not string node
							switch (true) {
								case part[2] === undef: //[] or {} part, ignore {}
									if (part[1].substr(0, 1) === '[' && part[1].substr(-1) === ']') { //attribute 
										attrStr = part[1].substr(1, part[1].length - 2);
										while(null !== (attr = attrReg.exec(attrStr))) { //please ensure tag write at head of unit
											var value = escapeBackSlashes(' ]', attr[3] || '');
											if (value == '') {
												isTarget = isTarget && tmpRoot.hasAttribute(attr[1]);
											} else {
												isTarget = isTarget && tmpRoot.hasAttribute(attr[1]) && tmpRoot.getAttribute(attr[1]) == value;
											}
										}
									}
									break;
								case part[2] === '': //tag
									isTarget = isTarget && tmpRoot.tagName == part[3].toUpperCase();
									break;
								case part[2] === '.': //class name
									isTarget = isTarget && tmpRoot.className.split(/\s+/g).indexOf(part[3]) !== -1;
									break;
								case part[2] === '#': //id
									isTarget = isTarget && tmpRoot.id == part[3];
									break;
							}
						}
						if (isTarget) {
							break;
						} else {
							tmpRoot = (tmpRoot.parentElement || tmpRoot.parentNode) || null;
						}
					}

					return tmpRoot;
				})(rootElement, elementString);
				if (rootElement === null) throw "Cannot find parent for \"" + elementString + "\"";
				else continue;
			}
			element = createElement(elementString);
			if (!element) continue;
			switch (op) {
				case '>':
					rootElement.appendChild(element);
					break;
				case '+':
					(rootElement.parentElement || rootElement.parentNode).appendChild(element);
					break;
				case '<':
				case '^':
					rootElement = (rootElement.parentElement || rootElement.parentNode) || rootElement;
					rootElement = (rootElement.parentElement || rootElement.parentNode) || rootElement;
					rootElement.appendChild(element);
					break;
			}
			rootElement = element;
		}

		rootElement = null;

		dom.getHTML = function() {
			var tmpElement = document.createElement('div');
			tmpElement.appendChild(dom.cloneNode(true));
			return tmpElement.innerHTML;
		};
		dom.appendTo = function(node) {
			return node.appendChild(dom);
		};

		return dom;
	};

	if('zen' in window) throw 'window.zen exists!';
	else window.zen = zen;
})(window);
