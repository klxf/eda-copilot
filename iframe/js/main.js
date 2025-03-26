let CACHE_NAME = null;
let chatHistory = [];
let CUSTOM_SETTINGS = {
	HOST: "http://localhost:11434",
	ENDPOINT: "/v1/chat/completions",
	MODEL: "",
	HEADER: {
		"Content-Type": "application/json"
	}
};
let GOOGLE_SETTINGS = {
	HOST: "https://generativelanguage.googleapis.com",
	API_KEY: "",
	HEADER: {
		"Content-Type": "application/json"
	}
};
let DS_SETTINGS = {
	HOST: "https://api.deepseek.com",
	API_KEY: "",
	HEADER: {
		"Content-Type": "application/json"
	}
};
let QWEN_SETTINGS = {
	HOST: "https://dashscope.aliyuncs.com",
	API_KEY: "",
	HEADER: {
		"Content-Type": "application/json"
	}
};
let MODEL_NAME = "gemini-1.5-flash-002";
let MODEL_GROUP = "Gemini";
let CHAT_TITLE = "新的对话";
let FILE_BASE64 = null;

console.log(eda.sys_Storage.getExtensionAllUserConfigs());

if(eda.sys_Storage.getExtensionUserConfig("GOOGLE-SETTINGS") !== undefined) {
	GOOGLE_SETTINGS = eda.sys_Storage.getExtensionUserConfig("GOOGLE-SETTINGS");
}

if (eda.sys_Storage.getExtensionUserConfig("DS-SETTINGS") !== undefined) {
	DS_SETTINGS = eda.sys_Storage.getExtensionUserConfig("DS-SETTINGS");
}

if (eda.sys_Storage.getExtensionUserConfig("QWEN-SETTINGS") !== undefined) {
	QWEN_SETTINGS = eda.sys_Storage.getExtensionUserConfig("QWEN-SETTINGS");
}

if (eda.sys_Storage.getExtensionUserConfig("CUSTOM-SETTINGS") !== undefined) {
	CUSTOM_SETTINGS = eda.sys_Storage.getExtensionUserConfig("CUSTOM-SETTINGS");
}

if(GOOGLE_SETTINGS.HOST !== null && GOOGLE_SETTINGS.HOST !== "" && GOOGLE_SETTINGS.HOST !== undefined) {
	document.getElementById("custom-google-host").value = GOOGLE_SETTINGS.HOST;
}

if (GOOGLE_SETTINGS.API_KEY !== null && GOOGLE_SETTINGS.API_KEY !== "" && GOOGLE_SETTINGS.API_KEY !== undefined) {
	document.getElementById("google-api-key").value = GOOGLE_SETTINGS.API_KEY;
}

if (GOOGLE_SETTINGS.HEADER !== null && GOOGLE_SETTINGS.HEADER !== "" && GOOGLE_SETTINGS.HEADER !== undefined) {
	document.getElementById("custom-google-header").value = JSON.stringify(GOOGLE_SETTINGS.HEADER);
}

if (DS_SETTINGS.HEADER !== null && DS_SETTINGS.HEADER !== "" && DS_SETTINGS.HEADER !== undefined) {
	document.getElementById("custom-ds-header").value = JSON.stringify(DS_SETTINGS.HEADER);
}

if (DS_SETTINGS.HOST !== null && DS_SETTINGS.HOST !== "" && DS_SETTINGS.HOST !== undefined) {
	document.getElementById("custom-ds-host").value = DS_SETTINGS.HOST;
}

if (DS_SETTINGS.API_KEY !== null && DS_SETTINGS.API_KEY !== "" && DS_SETTINGS.API_KEY !== undefined) {
	document.getElementById("ds-api-key").value = DS_SETTINGS.API_KEY;
}

if (QWEN_SETTINGS.HEADER !== null && QWEN_SETTINGS.HEADER !== "" && QWEN_SETTINGS.HEADER !== undefined) {
	document.getElementById("custom-qwen-header").value = JSON.stringify(QWEN_SETTINGS.HEADER);
}

if (QWEN_SETTINGS.HOST !== null && QWEN_SETTINGS.HOST !== "" && QWEN_SETTINGS.HOST !== undefined) {
	document.getElementById("custom-qwen-host").value = QWEN_SETTINGS.HOST;
}

if (QWEN_SETTINGS.API_KEY !== null && QWEN_SETTINGS.API_KEY !== "" && QWEN_SETTINGS.API_KEY !== undefined) {
	document.getElementById("qwen-api-key").value = QWEN_SETTINGS.API_KEY;
}

if (CUSTOM_SETTINGS.HOST !== null && CUSTOM_SETTINGS.HOST !== "" && CUSTOM_SETTINGS.HOST !== undefined) {
	document.getElementById("custom-host").value = CUSTOM_SETTINGS.HOST;
}

if (CUSTOM_SETTINGS.ENDPOINT !== null && CUSTOM_SETTINGS.ENDPOINT !== "" && CUSTOM_SETTINGS.ENDPOINT !== undefined) {
	document.getElementById("custom-endpoint").value = CUSTOM_SETTINGS.ENDPOINT;
}

if (CUSTOM_SETTINGS.HEADER !== null && CUSTOM_SETTINGS.HEADER !== "" && CUSTOM_SETTINGS.HEADER !== undefined) {
	document.getElementById("custom-header").value = JSON.stringify(CUSTOM_SETTINGS.HEADER);
}

if (CUSTOM_SETTINGS.MODEL !== null && CUSTOM_SETTINGS.MODEL !== "" && CUSTOM_SETTINGS.MODEL !== undefined) {
	document.getElementById("custom-model").value = CUSTOM_SETTINGS.MODEL;
}

document.getElementById('subtitle').innerText = MODEL_NAME;



function openSettings() {
	document.getElementById('settingsModal').style.display = 'block';
}

function closeSettings() {
	document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
	let customSettings = {
		HOST: document.getElementById('custom-host').value,
		ENDPOINT: document.getElementById('custom-endpoint').value,
		MODEL: document.getElementById('custom-model').value,
		HEADER: JSON.parse(document.getElementById('custom-header').value)
	};
	let googleSettings = {
		HOST: document.getElementById('custom-google-host').value,
		API_KEY: document.getElementById('google-api-key').value,
		HEADER: JSON.parse(document.getElementById('custom-google-header').value)
	};

	let dsSettings = {
		HOST: document.getElementById('custom-ds-host').value,
		API_KEY: document.getElementById('ds-api-key').value,
		HEADER: JSON.parse(document.getElementById('custom-ds-header').value)
	};

	let qwenSettings = {
		HOST: document.getElementById('custom-qwen-host').value,
		API_KEY: document.getElementById('qwen-api-key').value,
		HEADER: JSON.parse(document.getElementById('custom-qwen-header').value)
	};
	eda.sys_Storage.setExtensionUserConfig("CUSTOM-SETTINGS", customSettings);
	eda.sys_Storage.setExtensionUserConfig("GOOGLE-SETTINGS", googleSettings);
	eda.sys_Storage.setExtensionUserConfig("DS-SETTINGS", dsSettings);
	eda.sys_Storage.setExtensionUserConfig("QWEN-SETTINGS", qwenSettings);
	CUSTOM_SETTINGS = customSettings;
	GOOGLE_SETTINGS = googleSettings;
	DS_SETTINGS = dsSettings;
	QWEN_SETTINGS = qwenSettings;
	closeSettings();
}

function openModels() {
	document.getElementById('modelsModal').style.display = 'block';
}

function closeModels() {
	document.getElementById('modelsModal').style.display = 'none';
}

function saveModels() {
	MODEL_NAME = document.getElementById('model-name').value;
	document.getElementById('subtitle').innerText = MODEL_NAME;

	const select = document.getElementById('model-name');
	const selectedOption = select.options[select.selectedIndex];
	const selectedOptgroup = selectedOption.parentNode;

	if (selectedOptgroup.tagName === 'OPTGROUP') {
		console.log('选中的 optgroup 标签:', selectedOptgroup.label);
		MODEL_GROUP = selectedOptgroup.label;
		if (MODEL_GROUP === 'Gemini') {
			document.getElementById('google-settings').style.display = 'block';
			document.getElementById('ds-settings').style.display = 'none';
			document.getElementById('qwen-settings').style.display = 'none';
			document.getElementById('custom-settings').style.display = 'none';
		} else if (MODEL_GROUP === 'DeepSeek') {
			document.getElementById('ds-settings').style.display = 'block';
			document.getElementById('google-settings').style.display = 'none';
			document.getElementById('qwen-settings').style.display = 'none';
			document.getElementById('custom-settings').style.display = 'none';
		} else if (MODEL_GROUP === 'QWen') {
			document.getElementById('qwen-settings').style.display = 'block';
			document.getElementById('google-settings').style.display = 'none';
			document.getElementById('ds-settings').style.display = 'none';
			document.getElementById('custom-settings').style.display = 'none';
		} else {
			document.getElementById('custom-settings').style.display = 'block';
			document.getElementById('google-settings').style.display = 'none';
			document.getElementById('ds-settings').style.display = 'none';
			document.getElementById('qwen-settings').style.display = 'none';
		}
	}

	closeModels();
}

function createBubble(type, message, meta) {
	let bubble = document.createElement('div');
	bubble.className = 'message-bubble ' + type;
	console.log(message);
	bubble.innerHTML = '<div>' + marked.parse(message) + '</div>';
	if (!meta) {
		meta = new Date().toLocaleTimeString();
	}
	let metaElement = document.createElement('div');
	metaElement.className = 'message-meta';
	metaElement.innerHTML = meta;
	bubble.appendChild(metaElement);
	document.querySelector('.chat-body').appendChild(bubble);
	document.querySelector('.chat-body').scrollTop = document.querySelector('.chat-body').scrollHeight;
}
