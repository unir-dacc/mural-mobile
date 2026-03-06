import "@/global.css";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Sparkles, Palette, Smartphone, Zap, Shield, Code2 } from "lucide-react-native";
import React from "react";

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View className="mb-4 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
      <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/20">
        {icon}
      </View>

      <Text className="mb-2 text-lg font-bold text-white">{title}</Text>
      <Text className="text-sm leading-6 text-slate-300">{description}</Text>
    </View>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View className="mr-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2">
      <Text className="text-xs font-semibold uppercase tracking-widest text-cyan-200">{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <>
      <StatusBar style="light" />
      <View className="flex-1 bg-slate-950">
        <LinearGradient
          colors={["#020617", "#0F172A", "#1D4ED8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6 pt-20">
              <View className="mb-6 self-start rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-cyan-200">
                  expo + react native + nativewind
                </Text>
              </View>

              <Text className="max-w-xs text-5xl font-black leading-[56px] text-white">
                Interfaces bonitas, rápidas e consistentes
              </Text>

              <Text className="mt-5 max-w-md text-base leading-7 text-slate-300">
                NativeWind traz a ergonomia do Tailwind para React Native, com utilitários
                previsíveis, composição rápida e uma experiência de desenvolvimento muito mais
                produtiva.
              </Text>

              <View className="mt-6 flex-row flex-wrap">
                <Badge label="classes utilitárias" />
                <Badge label="tema escalável" />
                <Badge label="mobile first" />
              </View>

              <View className="mt-8 flex-row">
                <Pressable className="mr-3 rounded-2xl bg-cyan-400 px-5 py-4 active:opacity-80">
                  <Text className="font-bold text-slate-950">começar agora</Text>
                </Pressable>

                <Pressable className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 active:opacity-80">
                  <Text className="font-bold text-white">ver componentes</Text>
                </Pressable>
              </View>
            </View>

            <View className="mt-10 px-6">
              <View className="rounded-[32px] border border-white/10 bg-white/10 p-5">
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-white">destaques do nativewind</Text>
                  <View className="rounded-full bg-emerald-400/15 px-3 py-1">
                    <Text className="text-xs font-semibold text-emerald-300">100% utilitário</Text>
                  </View>
                </View>

                <View className="rounded-3xl bg-slate-900/70 p-5">
                  <View className="mb-4 flex-row items-center">
                    <View className="mr-3 h-3 w-3 rounded-full bg-rose-400" />
                    <View className="mr-3 h-3 w-3 rounded-full bg-amber-400" />
                    <View className="h-3 w-3 rounded-full bg-emerald-400" />
                  </View>

                  <Text className="font-mono text-sm leading-6 text-slate-200">
                    <Text className="text-cyan-300">{`<View `}</Text>
                    <Text className="text-violet-300">
                      className="flex-1 items-center justify-center bg-slate-950"
                    </Text>
                    <Text className="text-cyan-300">{`>`}</Text>
                    {"\n  "}
                    <Text className="text-cyan-300">{`<Text `}</Text>
                    <Text className="text-violet-300">
                      className="text-2xl font-bold text-cyan-400"
                    </Text>
                    <Text className="text-cyan-300">{`>`}</Text>
                    <Text className="text-white">UI elegante</Text>
                    <Text className="text-cyan-300">{`</Text>`}</Text>
                    {"\n"}
                    <Text className="text-cyan-300">{`</View>`}</Text>
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-8 px-6">
              <FeatureCard
                icon={<Zap size={22} color="#22D3EE" />}
                title="produtividade real"
                description="Monte layouts complexos rapidamente com classes utilitárias, sem perder consistência visual."
              />

              <FeatureCard
                icon={<Palette size={22} color="#22D3EE" />}
                title="estilo escalável"
                description="Padronize espaçamentos, tipografia, cores e estados interativos de forma simples e previsível."
              />

              <FeatureCard
                icon={<Smartphone size={22} color="#22D3EE" />}
                title="feito para mobile"
                description="A mesma mentalidade de design system aplicada ao ecossistema React Native e Expo."
              />

              <FeatureCard
                icon={<Code2 size={22} color="#22D3EE" />}
                title="componentes limpos"
                description="Menos objetos de estilo espalhados e mais legibilidade na composição visual da interface."
              />

              <FeatureCard
                icon={<Shield size={22} color="#22D3EE" />}
                title="consistência entre telas"
                description="Reduza divergências de UI usando regras claras de composição em todo o aplicativo."
              />

              <FeatureCard
                icon={<Sparkles size={22} color="#22D3EE" />}
                title="resultado mais refinado"
                description="Gradientes, cartões, badges, responsividade e hierarquia visual com pouco atrito."
              />
            </View>

            <View className="mt-4 px-6">
              <View className="rounded-[32px] border border-cyan-300/20 bg-cyan-400/10 p-6">
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-cyan-200">
                  conclusão
                </Text>

                <Text className="mt-3 text-2xl font-black text-white">
                  NativeWind acelera a entrega sem sacrificar qualidade visual.
                </Text>

                <Text className="mt-3 text-base leading-7 text-slate-200">
                  Para times que querem velocidade, padronização e uma experiência moderna de
                  styling em React Native, ele resolve um problema real.
                </Text>

                <Pressable className="mt-6 self-start rounded-2xl bg-white px-5 py-4 active:opacity-80">
                  <Text className="font-bold text-slate-950">explorar agora</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </>
  );
}
