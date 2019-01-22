import { Platform } from 'react-native';

const globalMethod = {
    hasAndroid: function () {
        return Platform.OS === 'android';
    }
};

export default globalMethod;