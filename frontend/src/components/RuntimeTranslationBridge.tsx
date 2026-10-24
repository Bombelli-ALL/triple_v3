import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { resolveAppLocale } from '@/lib/locale'
import { isRuntimeTranslatableSource, translateRuntimeText } from '@/lib/runtimeTranslations'

const TEXT_ORIGINALS = new WeakMap<Text, string>()
const LEAF_ORIGINALS = new WeakMap<Element, string>()
const ATTRIBUTE_ORIGINALS = new WeakMap<Element, Map<string, string>>()
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label']

function isSkippableElement(element: Element) {
	return ['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE'].includes(element.tagName)
}

function translateAttributes(element: Element, locale: ReturnType<typeof resolveAppLocale>) {
	let stored = ATTRIBUTE_ORIGINALS.get(element)
	if (!stored) {
		stored = new Map<string, string>()
		ATTRIBUTE_ORIGINALS.set(element, stored)
	}

	for (const attribute of TRANSLATABLE_ATTRIBUTES) {
		const currentValue = element.getAttribute(attribute)
		if (currentValue === null) continue

		if (!stored.has(attribute) && isRuntimeTranslatableSource(currentValue)) {
			stored.set(attribute, currentValue)
		}

		const sourceValue = stored.get(attribute)
		if (!sourceValue) continue

		const translated = locale === 'en' ? sourceValue : translateRuntimeText(locale, sourceValue)
		if (currentValue !== translated) {
			element.setAttribute(attribute, translated)
		}
	}
}

function translateLeafElement(element: Element, locale: ReturnType<typeof resolveAppLocale>) {
	if (element.children.length > 0) return

	const currentText = element.textContent ?? ''
	if (!LEAF_ORIGINALS.has(element) && isRuntimeTranslatableSource(currentText)) {
		LEAF_ORIGINALS.set(element, currentText)
	}

	const sourceText = LEAF_ORIGINALS.get(element)
	if (!sourceText) return

	const translated = locale === 'en' ? sourceText : translateRuntimeText(locale, sourceText)
	if (currentText !== translated) {
		element.textContent = translated
	}
}

function translateMixedTextNodes(element: Element, locale: ReturnType<typeof resolveAppLocale>) {
	for (const child of Array.from(element.childNodes)) {
		if (child.nodeType !== Node.TEXT_NODE) continue

		const textNode = child as Text
		const currentValue = textNode.nodeValue ?? ''
		if (!TEXT_ORIGINALS.has(textNode) && isRuntimeTranslatableSource(currentValue)) {
			TEXT_ORIGINALS.set(textNode, currentValue)
		}

		const sourceText = TEXT_ORIGINALS.get(textNode)
		if (!sourceText) continue

		const translated = locale === 'en' ? sourceText : translateRuntimeText(locale, sourceText)
		if (currentValue !== translated) {
			textNode.nodeValue = translated
		}
	}
}

function translateTree(root: ParentNode, locale: ReturnType<typeof resolveAppLocale>) {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
	let current = walker.nextNode()

	while (current) {
		const element = current as Element
		if (!isSkippableElement(element)) {
			translateAttributes(element, locale)
			if (element.children.length === 0) {
				translateLeafElement(element, locale)
			} else {
				translateMixedTextNodes(element, locale)
			}
		}
		current = walker.nextNode()
	}
}

export default function RuntimeTranslationBridge() {
	const { i18n } = useTranslation()
	const location = useLocation()

	useEffect(() => {
		const locale = resolveAppLocale(i18n.resolvedLanguage)
		let frameId = 0

		const runTranslation = () => {
			cancelAnimationFrame(frameId)
			frameId = requestAnimationFrame(() => {
				translateTree(document.body, locale)
			})
		}

		runTranslation()

		const observer = new MutationObserver(() => {
			runTranslation()
		})

		observer.observe(document.body, {
			subtree: true,
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: TRANSLATABLE_ATTRIBUTES,
		})

		return () => {
			cancelAnimationFrame(frameId)
			observer.disconnect()
		}
	}, [i18n.resolvedLanguage, location.pathname])

	return null
}
