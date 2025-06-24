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
import { Buffer } from 'buffer';
import { DeviceList } from './device';

const BleManagerModule = NativeModules.BleManager;
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
            .then(() => {
                console.log("conectemo");

                setTimeout(() => {
                    console.log("vamos inciiar o retive service");

                    let token = String(Date.now())
                    console.log("token que ou usar = ", token);


                    BleManager.retrieveServices(item.id).then(
                        (peripheralInfo) => {
                            // Success code


                            if (peripheralInfo.characteristics?.length) {
                                console.log(peripheralInfo.characteristics);
                                // let dados = peripheralInfo.characteristics[peripheralInfo.characteristics.length - 1]
                                let dados = peripheralInfo.characteristics[0]

                                const obj = {
                                    s: "FullCam",
                                    p: "FFullcam123",
                                    token
                                }

                                const jsonString = JSON.stringify(obj);
                                const encoder = new TextEncoder();
                                const byteArray = Array.from(encoder.encode(`spt=${jsonString}`));

                                console.log("enviando", byteArray);



                                const teste = JSON.stringify("getSN");
                                const testedois = Array.from(encoder.encode(teste));

                                BleManager.write(
                                    String(item.id),
                                    // dados.service,
                                    // dados.characteristic,
                                    "0000181c-0000-1000-8000-00805f9b34fb",
                                    "00002a8a-0000-1000-8000-00805f9b34fb",
                                    testedois
                                )
                                    .then(() => {
                                        console.log("envio deu certo");

                                    })
                                    .catch(() => {
                                        console.log("erro envio do primeiro");
                                    })
                                    .finally(() => {

                                        setTimeout(() => {
                                            BleManager.write(
                                                String(item.id),
                                                // dados.service,
                                                // dados.characteristic,
                                                "0000181c-0000-1000-8000-00805f9b34fb",
                                                "00002a8a-0000-1000-8000-00805f9b34fb",
                                                byteArray

                                            ).then(() => {
                                                // Success code
                                                console.log("Write Enviadoooo");

                                                //TODO testar com o iago isso aqui quando voltar
                                                setTimeout(() => {
                                                    BleManager.read(
                                                        item.id,
                                                        // dados.service,
                                                        // dados.characteristic
                                                        "0000181c-0000-1000-8000-00805f9b34fb",
                                                        "00002a8a-0000-1000-8000-00805f9b34fb"
                                                    )
                                                        .then((readData) => {
                                                            // Success code
                                                            console.log("Read: " + readData);

                                                            // https://github.com/feross/buffer
                                                            // https://nodejs.org/api/buffer.html#static-method-bufferfromarray
                                                            const buffer = Buffer.from(readData);
                                                            const sensorData = buffer.readUInt8(1, true);

                                                            console.log(sensorData);

                                                        })
                                                        .catch((error) => {
                                                            // Failure code
                                                            console.log("erro read", error);
                                                        });
                                                }, 500)
                                            })
                                                .catch((error) => {
                                                    // Failure code
                                                    console.log("erro do wirte", error);
                                                });


                                        }, 2000);


                                    })


                            }
                        }
                    );



                }, (1000));

            })
            .catch((err) => {
                console.log("deu erro pra conectar", err);
            })
    }
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