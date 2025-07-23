import React, { useEffect, useState } from 'react';
import {
    PermissionsAndroid,
    Platform,
    View,
    Text,
    Button,
    FlatList,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import md5 from 'md5'; // npm install md5

const SERVICE_UUID = '0000181c-0000-1000-8000-00805f9b34fb';
const WRITE_UUID = '00002a8a-0000-1000-8000-00805f9b34fb';
const NOTIFY_UUID = '00002a90-0000-1000-8000-00805f9b34fb';

const bleManager = new BleManager();

const toHex = (input: string) => {
    return Buffer.from(input, 'utf-8').toString('hex');
};

const BleExample = () => {

    const [devices, setDevices] = useState<any[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<any>(null);
    const [writeChar, setWriteChar] = useState<any>(null);
    const [notifyChar, setNotifyChar] = useState<any>(null);

    const wifiName = 'FullCam';
    const wifiPassword = 'FFullcam123';
    // const authCode = uuidv4().slice(0, 4);
    const token = md5(toHex(wifiName) + toHex("teszdsad") + toHex(wifiPassword));
    // const token = "teste"

    useEffect(() => {
        requestPermissions();
        return () => {
            bleManager.destroy();
        };
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            ]);
        }
    };

    const startScan = () => {
        console.log("start scan");

        setDevices([]);
        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                Alert.alert('Scan error', error.message);
                return;
            }
            if (device?.name?.includes('bz-')) {
                setDevices((prev) => {
                    if (!prev.find((d) => d.id === device.id)) {
                        return [...prev, device];
                    }
                    return prev;
                });
            }
        });

        setTimeout(() => bleManager.stopDeviceScan(), 10000);
    };

    const connect = async (device: any) => {
        console.log("iniciando conect");

        try {
            const connected = await device.connect();
            setConnectedDevice(connected);
            await connected.discoverAllServicesAndCharacteristics();
            const services = await connected.services();
            const targetService = services.find(
                (s) => s.uuid.toLowerCase() === SERVICE_UUID
            );
            if (!targetService) {
                Alert.alert('Service not found');
                return;
            }

            const characteristics = await targetService.characteristics();
            const write = characteristics.find(
                (c) => c.uuid.toLowerCase() === WRITE_UUID
            );
            const notify = characteristics.find(
                (c) => c.uuid.toLowerCase() === NOTIFY_UUID
            );

            if (write && notify) {
                setWriteChar(write);
                setNotifyChar(notify);
                setupNotification(notify);
                Alert.alert('Connected and ready');
            } else {
                Alert.alert('Characteristics not found');
            }
        } catch (e) {
            Alert.alert('Connection failed', e.message);
        }
    };

    const setupNotification = (char: any) => {
        char.monitor((error, characteristic) => {
            if (error) {
                console.log('Notification error:', error.message);
                return;
            }
            const value = Buffer.from(characteristic?.value || '', 'base64').toString(
                'utf-8'
            );
            console.log('Notification:', value);
        });
    };

    const sendWifiInfo = async () => {
        if (!writeChar) return;

        const command = `getSN`;
        const hex = Buffer.from(command, 'utf-8').toString('hex');
        const base64 = Buffer.from(hex, 'hex').toString('base64');



        // const json = JSON.stringify({ s: wifiName, p: wifiPassword, t: token });
        // const command = `spt=${json}`;
        // const hex = Buffer.from(command, 'utf-8').toString('hex');
        // const base64 = Buffer.from(hex, 'hex').toString('base64');




        try {
            await writeChar.writeWithResponse(base64);
            //
            Alert.alert('Enviado com sucesso!');
        } catch (e) {
            Alert.alert('Erro ao enviar', e.message);
        }


    };

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Button title="Buscar dispositivos" onPress={startScan} />
            <FlatList
                data={devices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => connect(item)}
                    >

                        <Text
                            style={{ padding: 10, borderBottomWidth: 1 }}
                        >
                            {item.name || 'Dispositivo sem nome'} - {item.id}
                        </Text>
                    </TouchableOpacity>
                )
                }
            />
            {
                connectedDevice && (
                    <Button title="Enviar Wi-Fi + Token" onPress={sendWifiInfo} />
                )
            }
        </View >
    );
};

export default BleExample;
