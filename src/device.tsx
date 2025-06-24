/* src/DeviceList.jsx */

import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { s } from './styles';

export const DeviceList = ({ peripheral, connect, disconnect }) => {
    const { name, rssi, connected } = peripheral;
    return (
        <>
            {name && (
                <View style={s.deviceContainer}>
                    <View style={s.deviceItem}>
                        <Text style={s.deviceName}>{name}</Text>
                        <Text style={s.deviceInfo}>RSSI: {rssi}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() =>
                            connected ? disconnect(peripheral) : connect(peripheral)
                        }
                        style={s.deviceButton}>
                        <Text
                            style={[
                                s.scanButtonText,
                                { fontWeight: 'bold', fontSize: 16 },
                            ]}>
                            {connected ? 'Disconnect' : 'Connect'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </>
    );
};