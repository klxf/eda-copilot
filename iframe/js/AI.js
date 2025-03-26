// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getAIResponse(contents) {
	let response;
	let thinking = document.createElement('div');
	thinking.className = 'message-bubble model';
	thinking.id = 'thinking';
	thinking.innerHTML = '<div><div class="loading"></div> 思考中...</div>';
	document.querySelector('.chat-body').appendChild(thinking);
	document.querySelector('.chat-body').scrollTop = document.querySelector('.chat-body').scrollHeight;

	if (MODEL_GROUP === "Gemini") {
		response = await getGeminiResponse(contents);
	} else if (MODEL_GROUP === "DeepSeek") {
		response = await getDeepSeekResponse(contents);
	} else if (MODEL_GROUP === "QWen") {
		response = await getQWenResponse(contents);
	} else if (MODEL_GROUP === "Custom") {
		response = await getCustomResponse(contents);
	} else {
		response = { err_code: 1, error: "模型不被支持" };
	}

	console.log(response);

	if (response.err_code === 0) {
		document.getElementById('thinking').remove();
		let content = response.response;
		content = content.replace(/\u003cthink\u003e/, '<div class="think">').replace(/\u003c\/think\u003e/, '</div>');
		createBubble('model', content, undefined);

		if (MODEL_GROUP === "Gemini") {
			chatHistory.push({ role: 'model', parts: [{ text: content }] });
		} else if (MODEL_GROUP === "DeepSeek" || MODEL_GROUP === "Qwen" || MODEL_GROUP === "Custom") {
			chatHistory.push({ role: 'assistant', content: content });
		}

		if (CHAT_TITLE === "新的对话") {
			let temp = chatHistory.slice();
			if (MODEL_GROUP === "Gemini") {
				temp.push({ role: 'user', parts: [{ text: "用几个字总结这个对话，将其作为对话的标题" }] });

				getGeminiResponse(temp).then(response => {
					if (response.err_code === 0) {
						const summary = response.response;
						CHAT_TITLE = summary.replace('*', '');
						document.getElementById('title').innerText = summary;
					}
				});
			} else if (MODEL_GROUP === "DeepSeek") {
				temp.push({ role: 'user', content: "用几个字总结这个对话，将其作为对话的标题，除此以外不要有任何其他文字" });

				getDeepSeekResponse(temp).then(response => {
					if (response.err_code === 0) {
						const summary = response.response;
						CHAT_TITLE = summary.replace(/\u003cthink\u003e.*\u003c\/think\u003e/ms, '').replace('*', '');
						document.getElementById('title').innerText = CHAT_TITLE;
					}
				});
			} else if (MODEL_GROUP === "QWen") {
				temp.push({ role: 'user', content: "用几个字总结这个对话，将其作为对话的标题，除此以外不要有任何其他文字" });

				getQWenResponse(temp).then(response => {
					if (response.err_code === 0) {
						const summary = response.response;
						CHAT_TITLE = summary.replace(/\u003cthink\u003e.*\u003c\/think\u003e/ms, '').replace('*', '');
						document.getElementById('title').innerText = CHAT_TITLE;
					}
				});
			} else if (MODEL_GROUP === "Custom") {
				temp.push({ role: 'user', content: "用几个字总结这个对话，将其作为对话的标题，除此以外不要有任何其他文字" });

				getCustomResponse(temp).then((response) => {
					if (response.err_code === 0) {
						const summary = response.response;
						CHAT_TITLE = summary.replace(/<think>.*<\/think>/ms, '').replaceAll('*', '').replaceAll('\n', '');
						document.getElementById('title').innerText = CHAT_TITLE;
					}
				});
			}
		}
	} else {
		document.getElementById('thinking').remove();
		createBubble('model', response.error, "异常");
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function setAICache(cache) {
	if (MODEL_GROUP === "Gemini" && MODEL_NAME !== "gemini-2.0-flash-001") {
		return await setGeminiCache(cache);
	} else if (MODEL_GROUP === "QWen" || MODEL_GROUP === "DeepSeek" || MODEL_GROUP === "Custom") {
		return await setOtherCache(decodeURIComponent(atob(cache)));
	} else if (MODEL_GROUP === "Gemini" && MODEL_NAME === "gemini-2.0-flash-001") {
		return await setOtherCache(decodeURIComponent(atob(cache)));
	} else {
		createBubble('model', "抱歉，该模型不支持缓存长上下文", "异常");
	}
}

async function getGeminiResponse(contents) {
	const API = GOOGLE_SETTINGS.HOST + "/v1beta/models/" + MODEL_NAME + ":generateContent?key=" + GOOGLE_SETTINGS.API_KEY;
	console.log(chatHistory);
	const data = {
		contents: [
			contents
		],
		safetySettings: [
			[
				{
					"category": "HARM_CATEGORY_HARASSMENT",
					"threshold": "BLOCK_ONLY_HIGH"
				},
				{
					"category": "HARM_CATEGORY_HATE_SPEECH",
					"threshold": "BLOCK_ONLY_HIGH"
				},
				{
					"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
					"threshold": "BLOCK_ONLY_HIGH"
				},
				{
					"category": "HARM_CATEGORY_DANGEROUS_CONTENT",
					"threshold": "BLOCK_ONLY_HIGH"
				}
			]
		]
	};

	if (CACHE_NAME !== null) {
		data.cachedContent = CACHE_NAME;
	} else {
		data.systemInstruction = { parts: [{ "text": "You are an electronic engineer. Use Chinese to answer." }] }
	}

	try {
		const response = await eda.sys_ClientUrl.request(API, "POST", JSON.stringify(data), { headers: GOOGLE_SETTINGS.HEADER });
		if (response.status !== 200) {
			throw new Error(response.statusText);
		}
		const result = await response.json();
		return {
			response: result.candidates[0].content.parts[0].text,
			err_code: 0
		};
	} catch (error) {
		return {
			error: error.message || "请求失败",
			err_code: 1
		};
	}
}

async function getDeepSeekResponse(contents) {
	const API = DS_SETTINGS.HOST + "/chat/completions";
	let HEADERS = DS_SETTINGS.HEADER;

	HEADERS['Authorization'] = 'Bearer ' + DS_SETTINGS.API_KEY;

	const data = {
		model: MODEL_NAME,
		messages: contents,
		stream: false
	}

	try {
		const response = await eda.sys_ClientUrl.request(API, "POST", JSON.stringify(data), { headers: HEADERS });
		if (response.status !== 200) {
			throw new Error(response.statusText);
		}
		const result = await response.json();
		return {
			response: result.choices[0].message.content,
			err_code: 0
		};
	} catch (error) {
		return {
			error: error.message || "请求失败",
			err_code: 1
		};
	}
}

async function getQWenResponse(contents) {
	const API = QWEN_SETTINGS.HOST + "/compatible-mode/v1/chat/completions";
	let HEADERS = QWEN_SETTINGS.HEADER;

	HEADERS['Authorization'] = 'Bearer ' + QWEN_SETTINGS.API_KEY;

	const data = {
		model: MODEL_NAME,
		messages: contents,
	}

	try {
		const response = await eda.sys_ClientUrl.request(API, "POST", JSON.stringify(data), { headers: HEADERS });
		if (response.status !== 200) {
			throw new Error(response.statusText);
		}
		const result = await response.json();
		return {
			response: result.choices[0].message.content,
			err_code: 0
		};
	} catch (error) {
		return {
			error: error.message || "请求失败",
			err_code: 1
		};
	}
}

async function getCustomResponse(contents) {
	const API = CUSTOM_SETTINGS.HOST + CUSTOM_SETTINGS.ENDPOINT;

	const data = {
		model: CUSTOM_SETTINGS.MODEL,
		messages: contents,
		stream: false
	}

	try {
		const response = await eda.sys_ClientUrl.request(API, "POST", JSON.stringify(data), { headers: CUSTOM_SETTINGS.HEADER });
		if (response.status !== 200) {
			throw new Error(response.statusText);
		}
		const result = await response.json();
		return {
			response: result.choices[0].message.content,
			err_code: 0
		};
	} catch (error) {
		return {
			error: error.message || "请求失败",
			err_code: 1
		};
	}
}

async function setGeminiCache(cache) {
	let API = GOOGLE_SETTINGS.HOST + "/v1beta/cachedContents?key=" + GOOGLE_SETTINGS.API_KEY;

	const data = {
		model: "models/" + MODEL_NAME,
		contents: [
			{ role: 'user', parts: [{ inline_data: { mime_type: "text/plain", data: cache} }, {text: "Here's a netlist file describing the circuit diagram, and I'm going to ask you questions about it."}] }
		],
		systemInstruction: {
			parts: [
				{
					"text": "You are an electronic engineer. The text describes a netlist of circuit diagrams. When asked a question about a component, it is displayed if there is a URL in the netlist, otherwise it is not. Use Chinese to answer."
				}
			]
		},
	}

	let thinking = document.createElement('div');
	thinking.className = 'message-bubble model';
	thinking.id = 'thinking';
	thinking.innerHTML = '<div><div class="loading"></div> 解读中...</div>';
	document.querySelector('.chat-body').appendChild(thinking);
	document.querySelector('.chat-body').scrollTop = document.querySelector('.chat-body').scrollHeight;

	eda.sys_ClientUrl.request(API, "POST", JSON.stringify(data), { headers: GOOGLE_SETTINGS.HEADER }).then(response => {
		if (response.status !== 200) {
			throw new Error(response.statusText);
		}
		return response.json();
	}).then(result => {
		document.getElementById('thinking').remove();
		createBubble('model', "好的，接下来你可以围绕这张原理图向我提问", undefined);
		CACHE_NAME = result.name;
	}).catch(error => {
		document.getElementById('thinking').remove();
		createBubble('model', error.toString(), "异常");
	});
}

async function setOtherCache(cache) {
	chatHistory.push({ role: 'user', content: '这是一个电路图的网表，后续回答依照这个网表回答：' + cache });
	chatHistory.push({ role: 'assistant', content: '好的，我了解了'});
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getNetlist() {
	let netlist = '';
	eda.sch_Netlist.getNetlist().then(data => {
		netlist = data[0].toString();
		const cache = btoa(encodeURIComponent(netlist));
		// 获取 cache 的字节数
		let size = cache.length;
		let unit = 'B';
		if (size > 1024) {
			size /= 1024;
			unit = 'KB';
		}
		if (size > 1024) {
			size /= 1024;
			unit = 'MB';
		}
		let fileBubble = document.createElement('div');
		fileBubble.classList.add('file-bubble');
		fileBubble.innerHTML = `<img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjMuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iJiN4NTZGRTsmI3g1QzQyO18xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiCgkgeT0iMHB4IiB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDE2IDE2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxyZWN0IHN0eWxlPSJmaWxsOm5vbmU7IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiLz4KPHJlY3Qgc3R5bGU9ImZpbGw6bm9uZTsiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPgo8cGF0aCBkPSJNMTUsNGgtMVYyYzAtMC41NS0wLjQ1LTEtMS0xSDRDMy40NSwxLDMsMS40NSwzLDJ2NEgxLjVDMS4yMiw2LDEsNi4yMiwxLDYuNUMxLDYuNzgsMS4yMiw3LDEuNSw3SDNoMWgxLjUKCUM1Ljc4LDcsNiw2Ljc4LDYsNi41QzYsNi4yMiw1Ljc4LDYsNS41LDZINFYyaDl2MmgtMWMtMC41NSwwLTEsMC40NS0xLDF2N2MwLDAuNTUsMC40NSwxLDEsMWgxdjJINHYtNGgxLjVDNS43OCwxMSw2LDEwLjc4LDYsMTAuNQoJQzYsMTAuMjIsNS43OCwxMCw1LjUsMTBINEgzSDEuNUMxLjIyLDEwLDEsMTAuMjIsMSwxMC41QzEsMTAuNzgsMS4yMiwxMSwxLjUsMTFIM3Y0YzAsMC41NSwwLjQ1LDEsMSwxaDljMC41NSwwLDEtMC40NSwxLTF2LTJoMQoJYzAuNTUsMCwxLTAuNDUsMS0xVjVDMTYsNC40NSwxNS41NSw0LDE1LDR6IE0xNSwxMmgtMWgtMWgtMVY1aDFoMWgxVjEyeiIvPgo8L3N2Zz4K" alt="File Icon" class="file-icon">
<div class="file-info">
<div class="file-name">网表文件</div>
<div class="file-size">${size} ${unit}</div>
</div>`;
		document.querySelector('.chat-body').appendChild(fileBubble);
		setAICache(cache);
	})

}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function setAIFile() {
	if (MODEL_GROUP !== "Gemini") {
		eda.sys_Message.showToastMessage('当前模型尚未支持该功能', 'warn');
		return;
	}
	const file = await eda.sys_FileSystem.openReadFileDialog("pdf");
	const reader = new FileReader();
	reader.onload = function (event) {
		const base64 = event.target.result;
		const title = file.name;
		// 判断是不是 pdf 文件
		if (file.type !== 'application/pdf') {
			eda.sys_Message.showToastMessage('仅可上传 PDF 格式的数据手册', 'warn');
			return;
		}
		FILE_BASE64 = base64.replaceAll('data:application/pdf;base64,', '');
		// 如果 chat-body 中最后一个元素是 file-bubble，替换之
		const chatBody = document.querySelector('.chat-body');
		const lastElement = chatBody.lastElementChild;
		if (lastElement && lastElement.classList.contains('file-bubble')) {
			lastElement.remove();
		}
		// 创建 file bubble
		let size = FILE_BASE64.length;
		let unit = 'B';
		if (size > 1024) {
			size /= 1024;
			unit = 'KB';
		}
		if (size > 1024) {
			size /= 1024;
			unit = 'MB';
		}
		let fileBubble = document.createElement('div');
		fileBubble.classList.add('file-bubble');
		fileBubble.innerHTML = `<img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjMuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iJiN4NTZGRTsmI3g1QzQyO18xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiCgkgeT0iMHB4IiB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDE2IDE2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxwYXRoIGQ9Ik04LjI5NiwxSDNDMi40NDgsMSwyLDEuNDQ4LDIsMnYxM2MwLDAuNTUyLDAuNDQ4LDEsMSwxaDEwYzAuNTUyLDAsMS0wLjQ0OCwxLTFWNS43MDRjMC0wLjI2NS0wLjEwNS0wLjUyLTAuMjkzLTAuNzA3CgljLTAuMzYyLTAuMjg1LTAuNzI1LTAuNTcxLTEuMDg3LTAuODU2Yy0wLjcwNi0wLjU1Ni0xLjQxMi0xLjExMi0yLjExOC0xLjY2OGMtMC4zNjgtMC4yOS0wLjc0NC0wLjU3MS0xLjExLTAuODY0CglDOS4wNTcsMS4zNDIsOC43NTcsMSw4LjI5NiwxeiBNMTIuMjksNUg5VjIuNzFMMTIuMjksNXogTTMsMTVWMmg1djNjMCwwLjU1MiwwLjQ0OCwxLDEsMWg0djlIM3oiLz4KPHJlY3Qgc3R5bGU9ImZpbGw6bm9uZTsiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPgo8cmVjdCBzdHlsZT0iZmlsbDpub25lOyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+Cjwvc3ZnPgo=" alt="File Icon" class="file-icon">
<div class="file-info">
<div class="file-name">${title}</div>
<div class="file-size">${size} ${unit}</div>
</div>`;
		document.querySelector('.chat-body').appendChild(fileBubble);
	};
	reader.readAsDataURL(file);
}

/* 废弃 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getDatasheetUrl() {
	try {
		const selectedPrimitives = await eda.sch_SelectControl.getAllSelectedPrimitives_PrimitiveId();
		const primitive = await eda.sch_PrimitiveComponent.get(selectedPrimitives[0]);
		let url = primitive[0].otherProperty.Datasheet;
		// atta.szlcsc.com -> atta-szlcsc.mirror.soraharu.com
		url = url.replace('atta.szlcsc.com', 'atta-szlcsc.mirror.soraharu.com');
		console.log(url);
		return url;
	} catch (error) {
		console.error(error);
		return null;
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getDatasheetData(url) {
	console.log(url);
	try {
		const response = await eda.sys_ClientUrl.request(url);
		const data = await response.text();
		console.log(data);
		return data;
	} catch (error) {
		console.error(error);
		return null;
	}
}

