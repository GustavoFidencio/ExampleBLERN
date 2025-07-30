import { s } from './styles';

import React, { useEffect, useState } from "react"
import {
    Text,
    Alert,
    View,
    FlatList,
    Platform,
    StatusBar,
    SafeAreaView,
    NativeModules,
    useColorScheme,
    TouchableOpacity,
    NativeEventEmitter,
    PermissionsAndroid,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { BleManager as BlePlxManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { DeviceList } from './device';

const BleManagerModule = NativeModules.BleManager;
const plxManager = new BlePlxManager();
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export const App = () => {

    const peripherals = new Map();
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevices, setConnectedDevices] = useState([]);
    const [discoveredDevices, setDiscoveredDevices] = useState([]);
    const [devices, setDevices] = useState([]);

    const handleGetConnectedDevices = () => {
        BleManager.getBondedPeripherals([]).then(results => {

            console.log(results);


            for (let i = 0; i < results.length; i++) {
                console.log("slaa to aqui 1");
                let peripheral = results[i];
                peripheral.connected = true;
                peripherals.set(peripheral.id, peripheral);

                setConnectedDevices(Array.from(peripherals.values()));
            }
        });
    };

    useEffect(() => {
        BleManager.enableBluetooth().then(() => {
            console.log('Bluetooth is turned on!');
        });
        BleManager.start({ showAlert: false }).then(() => {
            console.log('BleManager initialized');
            handleGetConnectedDevices();
        });

        let stopDiscoverListener = BleManagerEmitter.addListener(
            'BleManagerDiscoverPeripheral',
            peripheral => {

                console.log("to aquii", peripheral);


                peripherals.set(peripheral.id, peripheral);
                setDiscoveredDevices(Array.from(peripherals.values()));
            },
        );

        let stopConnectListener = BleManagerEmitter.addListener(
            'BleManagerConnectPeripheral',
            peripheral => {
                console.log('BleManagerConnectPeripheral:', peripheral);
            },
        );
        let stopScanListener = BleManagerEmitter.addListener(
            'BleManagerStopScan',
            () => {
                setIsScanning(false);
                console.log('scan stopped');
            },
        );

        if (Platform.OS === 'android' && Platform.Version >= 23) {
            PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ).then(result => {
                if (result) {
                    console.log('Permission is OK');
                } else {
                    PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    ).then(result => {
                        if (result) {
                            console.log('User accepted');
                        } else {
                            console.log('User refused');
                        }
                    });
                }
            });
        }

        BleManager.onDiscoverPeripheral(_sla)
        BleManager.onConnectPeripheral(_slaa)

        // let jonas = BleManagerEmitter.addListener(
        //     'noDiscoverPeripheral',
        //     peripheral => {
        //         console.log('BleManagerConnectPeripheral:', peripheral);
        //     },
        // );

        return () => {
            // jonas.remove();
            stopDiscoverListener.remove();
            stopConnectListener.remove();
            stopScanListener.remove();
        };
    }, []);

    const _slaa = (teste) => {

        console.log("novo", teste);

    }

    const _sla = (teste) => {

        // console.log(teste);


        if (teste.name == "bz-035c0002006bab32b75d") {
            // console.log(teste);

            // if (teste.id == "34:A6:EF:18:03:40") {
            console.log(teste);
            // }

            // let old = [...devices, teste]

            setDevices(old => [...old, teste]);
        }
        // console.log(teste);

    }

    const startScan = () => {
        if (!isScanning) {

            BleManager.scan([], 1)
                .then(() => {
                    console.log('Scanning...');
                    setIsScanning(true);

                    procedimento({ id: "34:A6:EF:18:03:40" });

                })
                .catch(error => {
                    console.error(error);
                });

        }
    };

    async function sendWifiInfo(device, serviceUUID, writeCharUUID) {
        try {
            const token = createRandom16() // ou use sua função segura

            const obj = {
                s: "FullCam",
                p: "FFullcam123",
                t: token
            };

            const fullPayload = `spr=${JSON.stringify(obj)}`;
            const payloadBuffer = Buffer.from(fullPayload, 'utf-8');
            const base64Data = payloadBuffer.toString('base64');

            console.log('[BLE] 📤 Enviando payload:', fullPayload);

            await device.writeCharacteristicWithResponseForService(
                serviceUUID,
                writeCharUUID,
                base64Data
            );

            console.log('[BLE] ✅ Dados enviados com sucesso!');

        } catch (err) {
            console.error('[BLE] ❌ Erro ao enviar WiFi info:', err);
        }
    }

    // pair with device first before connecting to it
    const connectToPeripheral = peripheral => {
        BleManager.createBond(peripheral.id)
            .then(() => {
                console.log("slaa to aqui 2");
                peripheral.connected = true;
                peripherals.set(peripheral.id, peripheral);

                setConnectedDevices(Array.from(peripherals.values()));
                setDiscoveredDevices(Array.from(peripherals.values()));
                console.log('BLE device paired successfully');
            })
            .catch(() => {
                console.log('failed to bond');
            });
    };

    // disconnect from device
    const disconnectFromPeripheral = peripheral => {
        BleManager.removeBond(peripheral.id)
            .then(() => {

                console.log("slaa to aqui 3");
                peripheral.connected = false;
                peripherals.set(peripheral.id, peripheral);
                // setConnectedDevices(Array.from(peripherals.values()));
                // setDiscoveredDevices(Array.from(peripherals.values()));
                Alert.alert(`Disconnected from ${peripheral.name}`);
            })
            .catch(() => {
                console.log('fail to remove the bond');
            });
    };
    const isDarkMode = useColorScheme() === 'dark';
    const backgroundStyle = {
        backgroundColor: isDarkMode ? 'gray' : 'white',
    };


    const procedimento = (item) => {
        BleManager.connect(item.id)
            .then(async () => {
                console.log("conectemo", item.id);
                let device = await plxManager.connectToDevice(item.id);


                await device.requestMTU(256)
                    .then((teste) => {
                        console.log('[BLE-PLX] ✅ NOVO MTU solicitado:', teste);
                        device = teste
                    })
                    .catch((err) => {
                        console.log("Erro ao setar novo mmmtu", err);
                    })
                // await device.requestMTU(256);

                const discovered = await device.discoverAllServicesAndCharacteristics();

                const services = await discovered.services();

                // console.log(services);

                let found = false;

                for (const service of services) {
                    console.log('[BLE] 🔍 Service UUID:', service);

                    if (service.uuid.toLowerCase() === "0000181c-0000-1000-8000-00805f9b34fb".toLowerCase()) {
                        found = true;
                        console.log('[BLE] ✅ Serviço esperado encontrado! UUID:', service.uuid);
                        // 🔧 Aqui você pode iniciar a comunicação
                        initBluetoothService(discovered, service); // Crie essa função!
                        break;
                    }
                }

                // setTimeout(() => {
                //     console.log("vamos inciiar o retive service");

                //     let token = String(Date.now())
                //     console.log("token que ou usar = ", token);


                //     BleManager.retrieveServices(item.id).then(
                //         (peripheralInfo) => {
                //             // Success code


                //             if (peripheralInfo.characteristics?.length) {
                //                 console.log(peripheralInfo.characteristics);
                //                 // let dados = peripheralInfo.characteristics[peripheralInfo.characteristics.length - 1]
                //                 let dados = peripheralInfo.characteristics[0]

                //                 const obj = {
                //                     s: "FullCam",
                //                     p: "FFullcam123",
                //                     token
                //                 }

                //                 const jsonString = JSON.stringify(obj);
                //                 const encoder = new TextEncoder();
                //                 const byteArray = Array.from(encoder.encode(`spt=${jsonString}`));

                //                 console.log("enviando", byteArray);



                //                 const teste = JSON.stringify("getSN");
                //                 const testedois = Array.from(encoder.encode(teste));

                //                 BleManager.write(
                //                     String(item.id),
                //                     // dados.service,
                //                     // dados.characteristic,
                //                     "0000181c-0000-1000-8000-00805f9b34fb",
                //                     "00002a8a-0000-1000-8000-00805f9b34fb",
                //                     testedois
                //                 )
                //                     .then(() => {
                //                         console.log("envio deu certo");

                //                     })
                //                     .catch(() => {
                //                         console.log("erro envio do primeiro");
                //                     })
                //                     .finally(() => {

                //                         setTimeout(() => {
                //                             BleManager.write(
                //                                 String(item.id),
                //                                 // dados.service,
                //                                 // dados.characteristic,
                //                                 "0000181c-0000-1000-8000-00805f9b34fb",
                //                                 "00002a8a-0000-1000-8000-00805f9b34fb",
                //                                 byteArray

                //                             ).then(() => {
                //                                 // Success code
                //                                 console.log("Write Enviadoooo");

                //                                 //TODO testar com o iago isso aqui quando voltar
                //                                 setTimeout(() => {
                //                                     BleManager.read(
                //                                         item.id,
                //                                         // dados.service,
                //                                         // dados.characteristic
                //                                         "0000181c-0000-1000-8000-00805f9b34fb",
                //                                         "00002a8a-0000-1000-8000-00805f9b34fb"
                //                                     )
                //                                         .then((readData) => {
                //                                             // Success code
                //                                             console.log("Read: " + readData);

                //                                             // https://github.com/feross/buffer
                //                                             // https://nodejs.org/api/buffer.html#static-method-bufferfromarray
                //                                             const buffer = Buffer.from(readData);
                //                                             const sensorData = buffer.readUInt8(1, true);

                //                                             console.log(sensorData);

                //                                         })
                //                                         .catch((error) => {
                //                                             // Failure code
                //                                             console.log("erro read", error);
                //                                         });
                //                                 }, 500)
                //                             })
                //                                 .catch((error) => {
                //                                     // Failure code
                //                                     console.log("erro do wirte", error);
                //                                 });


                //                         }, 2000);


                //                     })


                //             }
                //         }
                //     );



                // }, (1000));

            })
            .catch((err) => {
                console.log("deu erro pra conectar", err);
            })
    }

    const createRandom16 = () => {
        let result = '';
        const chars = '0123456789abcdef';
        for (let i = 0; i < 16; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }


    const CCCD_UUID = '00002902-0000-1000-8000-00805f9b34fb';


    const initBluetoothService = async (device: any, service: any) => {
        console.log("[BLE] 🚀 Iniciando comunicação com serviço:", service.uuid);

        const characteristics = await service.characteristics();

        console.log(characteristics);


        let readChar = null;
        let writeChar = null;

        for (const char of characteristics) {
            if (char.uuid.toLowerCase() === "00002a90-0000-1000-8000-00805f9b34fb") {
                readChar = char;
            }

            if (char.uuid.toLowerCase() === "00002a8a-0000-1000-8000-00805f9b34fb") {
                writeChar = char;
            }
        }

        if (!readChar || !writeChar) {
            console.error("[BLE] ❌ Características read/write não encontradas.");
            return;
        }

        try {
            // ✅ Inicia monitoramento (ativa notificação automaticamente via CCCD)
            await device.monitorCharacteristicForService(service.uuid, readChar.uuid, (error, characteristic) => {
                console.log("AAASASASASASASASASASASASASAS");

                if (error) {
                    console.error("[BLE] ❌ Erro no monitoramento:", error.message);
                    return;
                }


                
                console.log(atob(characteristic.value));
                console.log(characteristic);
                


                
                // if (characteristic?.value) {
                //     const buffer = Buffer.from(characteristic.value, 'base64');
                //     const mensagem = new TextDecoder().decode(buffer);
                //     console.log("[BLE] 📥 Notificação recebida:", mensagem);
                // } else {
                //     console.warn("[BLE] ⚠️ Característica notificada, mas sem valor.");
                // }
            });


            console.log(device);

            // await plxManager.writeDescriptorForDevice(
            //     device.id,
            //     '0000181c-0000-1000-8000-00805f9b34fb', // serviceUUID
            //     '00002a90-0000-1000-8000-00805f9b34fb', // characteristicUUID
            //     '00002902-0000-1000-8000-00805f9b34fb', // descriptorUUID
            //     Buffer.from([0x01, 0x00]).toString('base64') // ENABLE_NOTIFICATION_VALUE

            // )
            //     // await device.writeDescriptorForDevice(
            //     // )
            //     .then((val) => {
            //         console.log("deu no,", val);

            //     })
            //     .catch(err => {
            //         console.log("errrrr", err);
            //     })

            console.log("[BLE] ✅ Monitoramento iniciado.");

            setTimeout(async () => {
                const characteristics = await service.characteristics();
                console.log('aaaa', characteristics);

                if (characteristics[0].isNotifying) {

                    try {
                        const payload = Buffer.from("getPD", "utf8").toString("base64");

                        // await device.writeCharacteristicWithResponseForService(payload);
                        // await writeChar.writeCharacteristicWithResponseForService(payload);


                        await device.writeCharacteristicWithResponseForService(
                            service.uuid,
                            writeChar.uuid,
                            payload
                        );

                        setTimeout(() => {
                            sendWifiInfo(device, service.uuid, writeChar.uuid)
                        }, 2000);

                        console.log("[BLE] ✉️ Comando 'getSN' enviado.");
                    } catch (err) {
                        console.error("[BLE] ❌ Erro ao enviar 'getSN':", err.message);
                    }

                }
            }, 2000);

        } catch (monitorError) {
            console.error("[BLE] ❌ Falha ao iniciar monitoramento:", monitorError.message);
            return;
        }

        // ✉️ Envia comando "getSN"
        // setTimeout(async () => {
        //     try {
        //         const payload = Buffer.from("getSN", "utf8").toString("base64");
        //         await writeChar.writeWithResponse(payload);
        //         console.log("[BLE] ✉️ Comando 'getSN' enviado.");
        //     } catch (err) {
        //         console.error("[BLE] ❌ Erro ao enviar 'getSN':", err.message);
        //     }
        // }, 1000);
    }



    // const initBluetoothService = async (device: any, service: any) => {

    //     console.log("init blutu service");


    //     let readChar = null;
    //     let writeChar = null;

    //     const characteristics = await service.characteristics();

    //     console.log("characteristics", characteristics);


    //     for (const char of characteristics) {


    //         console.log(`${char.uuid} - isNotifiable: ${char.isNotifiable} isIndicatable: ${char.isIndicatable}`);
    //         if (char.uuid.toLowerCase() === "00002a90-0000-1000-8000-00805f9b34fb".toLowerCase()) {
    //             readChar = char;
    //         }

    //         if (char.uuid.toLowerCase() === "00002a8a-0000-1000-8000-00805f9b34fb".toLowerCase()) {
    //             writeChar = char;
    //         }
    //     }

    //     // const data = await readChar.read();
    //     // console.log('[BLE] 📖 Leitura manual (se suportar leitura):', data.value);

    //     console.log("init monitor", readChar);
    //     await device.monitorCharacteristicForService(service.uuid, readChar.uuid, (error, characteristic) => {
    //         if (error) {
    //             console.error('[BLE] ❌ Erro no monitor:', error.message);
    //             return;
    //         }

    //         const base64 = characteristic?.value;
    //         if (base64) {
    //             const bytes = Buffer.from(base64, 'base64');
    //             const message = new TextDecoder().decode(bytes);
    //             console.log('[BLE] 📥 Notificação recebida:', message);
    //         }
    //     });
    //     // const subscription = device.monitorCharacteristicForService(
    //     //     service.uuid,
    //     //     readChar.uuid,
    //     //     (error, characteristic) => {
    //     //         if (error) {
    //     //             console.error('[BLE] ❌ Falha ao monitorar:', error);
    //     //             return;
    //     //         }

    //     //         const base64Value = characteristic.value;
    //     //         const bytes = Buffer.from(base64Value, 'base64');
    //     //         console.log('[BLE] 📥 Dados recebidos:', Array.from(bytes));
    //     //     }
    //     // );

    //     const sendText = async (text) => {
    //         const base64 = Buffer.from(text, 'utf-8').toString('base64');
    //         await device.writeCharacteristicWithResponseForService(service.uuid, writeChar.uuid, base64);
    //         console.log('[BLE] Enviado:', text);
    //     };

    //     // await sendText('getSN');

    //     setTimeout(async () => {
    //         const payload = Buffer.from("getSN", "utf8").toString("base64");
    //         await writeChar.writeWithResponse(payload);
    //         console.log("[BLE] ✉️ Comando 'getSN' enviado.");
    //     }, 1000);

    //     setTimeout(async () => {

    //         const token = createRandom16()

    //         const json = {
    //             s: "FullCam",
    //             p: "FFullcam123",
    //             t: token
    //         };

    //         const payload = Buffer.from(`spt=${JSON.stringify(json)}`, 'utf8').toString('base64');
    //         await writeChar.writeWithResponse(payload);
    //         console.log('[BLE] ✉️ Dados Wi-Fi + Token enviados.');
    //     }, 2000);

    //     // setTimeout(() => {
    //     //     sendWifiInfo(device, service.uuid, writeChar.uuid)
    //     // }, 10000);

    // }


    // render list of bluetooth devices
    return (

        <SafeAreaView style={[backgroundStyle, s.container]}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={backgroundStyle.backgroundColor}
            />
            <View style={{ paddingHorizontal: 20 }}>
                <Text
                    style={[
                        s.title,
                        { color: 'white' },
                    ]}>
                    React Native BLE
                </Text>
                <TouchableOpacity
                    activeOpacity={0.5}
                    style={s.scanButton}
                    onPress={startScan}>
                    <Text style={s.scanButtonText}>
                        {isScanning ? 'Scanning...' : 'Scan Bluetooth Devices'}
                    </Text>
                </TouchableOpacity>
                <Text
                    style={[
                        s.subtitle,
                        { color: 'white' },
                    ]}>
                    Todos os dispositivos
                </Text>
                {devices.length > 0 ? (
                    <FlatList
                        data={devices}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={{
                                    marginVertical: 5,
                                    padding: 15,
                                    backgroundColor: 'green',
                                }}
                                onPress={() => {
                                    procedimento(item)
                                }}
                            >

                                <Text>{item.name}</Text>
                                <Text>{item.id}</Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => String(index)}
                    />
                ) : (
                    <Text style={s.noDevicesText}>Sla nao tem dispostivo</Text>
                )}
                <Text
                    style={[
                        s.subtitle,
                        { color: 'white' },
                    ]}>
                    Discovered Devices:
                </Text>

                {discoveredDevices.length > 0 ? (
                    <FlatList
                        data={discoveredDevices}
                        renderItem={({ item }) => (
                            <DeviceList
                                peripheral={item}
                                connect={connectToPeripheral}
                                disconnect={disconnectFromPeripheral}
                            />
                        )}
                        keyExtractor={item => item.id}
                    />
                ) : (
                    <Text style={s.noDevicesText}>No Bluetooth devices found</Text>
                )}
                <Text
                    style={[
                        s.subtitle,
                        { color: 'white' },
                    ]}>
                    Connected Devices:
                </Text>
                {connectedDevices.length > 0 ? (
                    <FlatList
                        data={connectedDevices}
                        renderItem={({ item }) => (
                            <DeviceList
                                peripheral={item}
                                connect={connectToPeripheral}
                                disconnect={disconnectFromPeripheral}
                            />
                        )}
                        keyExtractor={item => item.id}
                    />
                ) : (
                    <Text style={s.noDevicesText}>No connected devices</Text>
                )}
            </View>
            <Text>
                a?GJDFJGDJ?GFKJ?DFGJK?DFGJ?
            </Text>
        </SafeAreaView>
    )
}