import DeviceInfo from 'react-native-device-info';

const userAgent = {
    source: 'APP',//来源客户端
    systemName: DeviceInfo.getSystemName(),//设备系统类型iOS或android
    systemVersion: DeviceInfo.getSystemVersion(),//设备系统版本如，'4.0'
    model: encodeURIComponent(DeviceInfo.getModel()),//设备名iPhone X
    appVersion: DeviceInfo.getVersion(),//应用的当前版本
    userAgent: DeviceInfo.getUserAgent()
};

const HeaderFieldValueDictionary = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'TM-Header-CurTime': new Date().getTime().toString().substr(0,10),
    'userAgent': JSON.stringify(userAgent)
};

export default HeaderFieldValueDictionary;